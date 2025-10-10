const db = require("../config/database.config.js");
const fs = require('fs'); // Modul untuk mengelola file (File System)
const path = require('path'); // Modul untuk mengelola path direktori

const Quiz = {};

// --- Helper function untuk menghapus file dengan aman ---
const deleteFile = (url) => {
    if (!url) return;
    try {
        const filePath = path.join(__dirname, '..', url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`File berhasil dihapus: ${filePath}`);
        }
    } catch (err) {
        console.error(`Gagal menghapus file: ${url}`, err);
    }
};

// === FUNGSI UNTUK GURU (ADMIN) ===

Quiz.create = async (title, description, creatorId, coverImageUrl, recommendedLevel) => {
    // ... (Fungsi ini tidak berubah)
    const [result] = await db.execute(
        "INSERT INTO quizzes (title, description, creator_id, cover_image_url, recommended_level) VALUES (?, ?, ?, ?, ?)",
        [title, description, creatorId, coverImageUrl, recommendedLevel]
    );
    return { id: result.insertId, title, description, creatorId, coverImageUrl, recommendedLevel };
};

Quiz.addQuestion = async (quizId, data) => {
    // ... (Fungsi ini tidak berubah)
    const { question_text, question_image_url, question_type, options, correct_essay_answer } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [qResult] = await conn.execute(
            "INSERT INTO quiz_questions (quiz_id, question_text, question_image_url, question_type, correct_essay_answer) VALUES (?, ?, ?, ?, ?)",
            [quizId, question_text, question_image_url || null, question_type, correct_essay_answer || null]
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

// --- ▼▼▼ FUNGSI INI YANG DIPERBARUI SECARA TOTAL ▼▼▼ ---
Quiz.delete = async (quizId) => {
    // 1. Ambil URL gambar cover kuis
    const [quizRows] = await db.execute("SELECT cover_image_url FROM quizzes WHERE id = ?", [quizId]);

    // 2. Ambil semua URL gambar dari setiap soal di dalam kuis ini
    const [questionRows] = await db.execute("SELECT question_image_url FROM quiz_questions WHERE quiz_id = ?", [quizId]);

    // 3. Hapus semua file yang ditemukan
    if (quizRows.length > 0) {
        deleteFile(quizRows[0].cover_image_url);
    }
    questionRows.forEach(row => {
        deleteFile(row.question_image_url);
    });

    // 4. Setelah semua file dihapus, baru hapus data kuis dari database.
    // (Jika Anda menggunakan ON DELETE CASCADE di database, ini akan menghapus semua soal, opsi, dan submission terkait)
    const [result] = await db.execute("DELETE FROM quizzes WHERE id = ?", [quizId]);
    return result.affectedRows;
};

// --- ▼▼▼ FUNGSI INI SUDAH BENAR DARI SEBELUMNYA ▼▼▼ ---
Quiz.deleteQuestion = async (questionId) => {
    // 1. Ambil informasi file dari database SEBELUM menghapus datanya
    const [rows] = await db.execute("SELECT question_image_url FROM quiz_questions WHERE id = ?", [questionId]);
    
    // 2. Hapus file fisiknya
    if (rows.length > 0) {
        deleteFile(rows[0].question_image_url);
    }

    // 3. Lanjutkan menghapus record soal dari database
    const [result] = await db.execute("DELETE FROM quiz_questions WHERE id = ?", [questionId]);
    return result.affectedRows;
};


// === FUNGSI LAINNYA (TIDAK ADA PERUBAHAN) ===
// ... (sisa kode seperti getAll, getQuestionsForQuiz, submit, getSubmissionsByQuizId, dll. biarkan apa adanya)
Quiz.getAll = async () => {
    const query = `
        SELECT 
            q.id, 
            q.title, 
            q.description, 
            q.cover_image_url,
            q.recommended_level,
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
    if (isNaN(numericQuizId)) {
        throw new Error("Quiz ID tidak valid.");
    }
    const [correctAnswers] = await db.execute(`
        SELECT 
            qq.id as question_id,
            (SELECT qo.option_text FROM quiz_question_options qo WHERE qo.question_id = qq.id AND qo.is_correct = 1 LIMIT 1) as correct_option
        FROM quiz_questions qq
        WHERE qq.quiz_id = ? AND qq.question_type = 'pilihan-ganda'
    `, [numericQuizId]);
    const answerMap = new Map(correctAnswers.map(ans => [ans.question_id, ans.correct_option]));
    let correctCount = 0;
    for (const ans of answers) {
        if (answerMap.get(parseInt(ans.questionId, 10)) === ans.answer) {
            correctCount++;
        }
    }
    const totalQuestions = answerMap.size;
    const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const [result] = await db.execute(
        "INSERT INTO quiz_submissions (user_id, quiz_id, score) VALUES (?, ?, ?)",
        [userId, numericQuizId, finalScore]
    );
    return { submissionId: result.insertId, score: finalScore };
};

Quiz.getSubmissionsByQuizId = async (quizId) => {
    const numericQuizId = parseInt(quizId, 10);
    if (isNaN(numericQuizId)) {
        return [];
    }
    const query = `
        SELECT 
            qs.id,
            qs.score,
            qs.submitted_at as submission_date,
            u.nama as student_name
        FROM quiz_submissions qs
        JOIN users u ON qs.user_id = u.id
        WHERE qs.quiz_id = ?
        ORDER BY qs.score DESC, qs.submitted_at ASC
    `;
    const [rows] = await db.execute(query, [numericQuizId]);
    return rows;
};


module.exports = Quiz;