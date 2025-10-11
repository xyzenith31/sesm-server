// contoh-server-sesm/models/quiz.model.js
const db = require("../config/database.config.js");
const fs = require('fs');
const path = require('path');

const Quiz = {};

const deleteFile = (url) => {
    if (!url) return;
    try {
        const filePath = path.join(__dirname, '..', url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error(`Gagal menghapus file: ${url}`, err);
    }
};

// === FUNGSI UNTUK GURU (ADMIN) ===

Quiz.create = async (title, description, creatorId, coverImageUrl, recommendedLevel) => {
    const [result] = await db.execute(
        "INSERT INTO quizzes (title, description, creator_id, cover_image_url, recommended_level) VALUES (?, ?, ?, ?, ?)",
        [title, description, creatorId, coverImageUrl, recommendedLevel]
    );
    return { id: result.insertId, title, description, creatorId, coverImageUrl, recommendedLevel };
};

Quiz.addQuestion = async (quizId, data) => {
    const { question_text, question_image_url, question_type, options } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [qResult] = await conn.execute(
            "INSERT INTO quiz_questions (quiz_id, question_text, question_image_url, question_type) VALUES (?, ?, ?, ?)",
            [quizId, question_text, question_image_url || null, question_type]
        );
        const questionId = qResult.insertId;

        if (question_type === 'pilihan-ganda' && options) {
            for (const opt of options) {
                await conn.execute(
                    "INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
                    [questionId, opt.text, opt.isCorrect]
                );
            }
        }
        await conn.commit();
        return { id: questionId, ...data };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// --- FUNGSI BARU UNTUK BANK SOAL ---
Quiz.addQuestionsFromBank = async (quizId, questionIds) => {
    if (!questionIds || questionIds.length === 0) {
        return 0;
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        let questionsAdded = 0;
        for (const questionId of questionIds) {
            // 1. Ambil data soal asli dari tabel `questions`
            const [originalQuestions] = await conn.execute("SELECT * FROM questions WHERE id = ?", [questionId]);
            if (originalQuestions.length === 0) continue;
            const originalQ = originalQuestions[0];

            // 2. Salin data ke tabel `quiz_questions`
            // Perhatikan media_urls disalin sebagai question_image_url untuk sementara
            const [newQResult] = await conn.execute(
                "INSERT INTO quiz_questions (quiz_id, question_text, question_image_url, question_type, correct_essay_answer) VALUES (?, ?, ?, ?, ?)",
                [quizId, originalQ.pertanyaan, originalQ.media_urls, originalQ.tipe_soal, originalQ.jawaban_esai]
            );
            const newQuizQuestionId = newQResult.insertId;

            // 3. Jika pilihan ganda, salin juga opsinya
            if (originalQ.tipe_soal.includes('pilihan-ganda')) {
                const [originalOptions] = await conn.execute("SELECT * FROM question_options WHERE question_id = ?", [questionId]);
                for (const opt of originalOptions) {
                    await conn.execute(
                        "INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
                        [newQuizQuestionId, opt.opsi_jawaban, opt.is_correct]
                    );
                }
            }
            questionsAdded++;
        }

        await conn.commit();
        return questionsAdded;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

Quiz.delete = async (quizId) => {
    const [quizRows] = await db.execute("SELECT cover_image_url FROM quizzes WHERE id = ?", [quizId]);
    const [questionRows] = await db.execute("SELECT question_image_url FROM quiz_questions WHERE quiz_id = ?", [quizId]);
    if (quizRows.length > 0) {
        deleteFile(quizRows[0].cover_image_url);
    }
    questionRows.forEach(row => {
        deleteFile(row.question_image_url);
    });
    const [result] = await db.execute("DELETE FROM quizzes WHERE id = ?", [quizId]);
    return result.affectedRows;
};

Quiz.deleteQuestion = async (questionId) => {
    const [rows] = await db.execute("SELECT question_image_url FROM quiz_questions WHERE id = ?", [questionId]);
    if (rows.length > 0) {
        deleteFile(rows[0].question_image_url);
    }
    const [result] = await db.execute("DELETE FROM quiz_questions WHERE id = ?", [questionId]);
    return result.affectedRows;
};

// === FUNGSI LAINNYA ===
Quiz.getAll = async () => {
    const query = `
        SELECT 
            q.id, q.title, q.description, q.cover_image_url, q.recommended_level,
            u.nama as creator_name,
            (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count
        FROM quizzes q
        JOIN users u ON q.creator_id = u.id
        ORDER BY q.created_at DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
};

Quiz.getQuestionsForQuiz = async (quizId) => {
    const id = parseInt(quizId, 10);
    if (isNaN(id)) return [];
    const [questions] = await db.execute("SELECT id, question_text, question_image_url, question_type FROM quiz_questions WHERE quiz_id = ?", [id]);
    for (const q of questions) {
        if (q.question_type === 'pilihan-ganda') {
            const [options] = await db.execute("SELECT id, option_text FROM quiz_question_options WHERE question_id = ?", [q.id]);
            q.options = options;
        }
    }
    return questions;
};

Quiz.getQuestionsForAdmin = async (quizId) => {
    const id = parseInt(quizId, 10);
    if (isNaN(id)) return [];
    const [questions] = await db.execute("SELECT id, question_text, question_image_url, question_type FROM quiz_questions WHERE quiz_id = ?", [id]);
    for (const q of questions) {
        if (q.question_type === 'pilihan-ganda') {
            const [options] = await db.execute("SELECT id, option_text, is_correct FROM quiz_question_options WHERE question_id = ?", [q.id]);
            q.options = options;
        }
    }
    return questions;
};

Quiz.submit = async (userId, quizId, answers) => {
    const numericQuizId = parseInt(quizId, 10);
    if (isNaN(numericQuizId)) throw new Error("Quiz ID tidak valid.");

    const [correctAnswers] = await db.execute(`
        SELECT qq.id as question_id, qo.option_text as correct_option
        FROM quiz_questions qq
        JOIN quiz_question_options qo ON qq.id = qo.question_id
        WHERE qq.quiz_id = ? AND qo.is_correct = 1
    `, [numericQuizId]);

    const answerMap = new Map(correctAnswers.map(ans => [ans.question_id, ans.correct_option]));
    let correctCount = 0;
    
    for (const ans of answers) {
        if (answerMap.get(parseInt(ans.questionId, 10)) === ans.answer) {
            correctCount++;
        }
    }

    const [totalQ] = await db.execute("SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_id = ?", [numericQuizId]);
    const totalQuestions = totalQ[0].count;
    
    const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    const [result] = await db.execute(
        "INSERT INTO quiz_submissions (user_id, quiz_id, score) VALUES (?, ?, ?)",
        [userId, numericQuizId, finalScore]
    );
    return { submissionId: result.insertId, score: finalScore };
};

Quiz.getSubmissionsByQuizId = async (quizId) => {
    const numericQuizId = parseInt(quizId, 10);
    if (isNaN(numericQuizId)) return [];
    
    const query = `
        SELECT qs.id, qs.score, qs.submitted_at as submission_date, u.nama as student_name
        FROM quiz_submissions qs
        JOIN users u ON qs.user_id = u.id
        WHERE qs.quiz_id = ?
        ORDER BY qs.score DESC, qs.submitted_at ASC
    `;
    const [rows] = await db.execute(query, [numericQuizId]);
    return rows;
};

module.exports = Quiz;