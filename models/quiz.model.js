// contoh-server-sesm/models/quiz.model.js
const db = require("../config/database.config.js");
const fs = require('fs');
const path = require('path');

const Quiz = {};

// Fungsi hapus file
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

// === FUNGSI DIPERBARUI: updateSettings ===
Quiz.updateSettings = async (quizId, settings) => {
    const validSettings = [
        'setting_time_per_question', 'setting_randomize_questions', 'setting_randomize_answers',
        'setting_show_leaderboard', 'setting_show_memes', 'setting_allow_redemption',
        'setting_play_music', 'setting_is_timer_enabled', 'setting_strict_scoring',
        'setting_points_per_correct'
    ];
    const fields = [];
    const values = [];

    for (const key in settings) {
        if (validSettings.includes(key)) {
            fields.push(`${key} = ?`);
            let value = settings[key];
            if (typeof value === 'boolean') { value = value ? 1 : 0; }
            if (key === 'setting_points_per_correct') {
                value = parseInt(value, 10);
                if (isNaN(value) || value <= 0) { value = 100; } // Default
            }
            if (key === 'setting_time_per_question') {
                if (!settings.setting_is_timer_enabled) { value = null; }
                else {
                     value = parseInt(value, 10);
                     if (isNaN(value) || value < 5 || value > 300) { value = 20; } // Default
                }
            }
            values.push(value);
        }
    }

    if (fields.length === 0) {
        console.warn(`[WARN] No valid settings fields provided for quizId: ${quizId}`);
        return { affectedRows: 0 };
    }
    const query = `UPDATE quizzes SET ${fields.join(", ")} WHERE id = ?`;
    values.push(quizId);
    console.log(`[DEBUG] Executing updateSettings query for quizId ${quizId}:`, query);
    console.log(`[DEBUG] Values:`, values);
    const [result] = await db.execute(query, values);
    return result;
};

// === FUNGSI DIPERBARUI: findById ===
Quiz.findById = async (quizId) => {
    // Pastikan kolom baru diambil
    const [rows] = await db.execute(
        "SELECT title, setting_strict_scoring, setting_points_per_correct FROM quizzes WHERE id = ?",
        [quizId]
    );
    return rows[0] ? {
        title: rows[0].title,
        strictScoringEnabled: !!rows[0].setting_strict_scoring, // Konversi ke boolean
        pointsPerCorrectStrict: rows[0].setting_points_per_correct || 100 // Default 100
     } : null;
};

// === FUNGSI EDIT SOAL ===
Quiz.updateQuestion = async (questionId, data) => {
    const { question_text, question_type, options, media_attachments, essayAnswer } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [oldQuestion] = await conn.execute("SELECT media_attachments FROM quiz_questions WHERE id = ?", [questionId]);
        const oldMediaJson = oldQuestion[0]?.media_attachments;

        await conn.execute(
            "UPDATE quiz_questions SET question_text = ?, question_type = ?, media_attachments = ?, correct_essay_answer = ? WHERE id = ?",
            [question_text, question_type, JSON.stringify(media_attachments || []), essayAnswer || null, questionId]
        );

        if (oldMediaJson) {
            try {
                const oldMedia = JSON.parse(oldMediaJson);
                const newMediaUrls = (media_attachments || []).map(item => item.url);
                oldMedia.forEach(item => { if (item.type === 'file' && item.url && !newMediaUrls.includes(item.url)) { deleteFile(item.url); } });
            } catch (parseError) { console.error("Error parsing old media_attachments during update:", parseError); }
        }

        await conn.execute("DELETE FROM quiz_question_options WHERE question_id = ?", [questionId]); // Hapus opsi lama dulu
        if (question_type.includes('pilihan-ganda') && options && Array.isArray(options)) {
            for (const opt of options) {
                 if (opt && typeof opt.text !== 'undefined' && typeof opt.isCorrect !== 'undefined') {
                    await conn.execute( "INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)", [questionId, opt.text, opt.isCorrect ? 1 : 0] ); // Pastikan isCorrect adalah 1 atau 0
                 } else { console.warn(`[WARN] Invalid option format skipped for questionId ${questionId}:`, opt); }
            }
        }
        await conn.commit();
        return { id: questionId, ...data };
    } catch (error) {
        await conn.rollback(); console.error(`[ERROR] Rollback during updateQuestion for questionId ${questionId}:`, error); throw error;
    } finally { conn.release(); }
};

// === FUNGSI TAMBAH SOAL ===
Quiz.addQuestion = async (quizId, data) => {
    const { question_text, question_type, options, media_attachments, essayAnswer } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [qResult] = await conn.execute( "INSERT INTO quiz_questions (quiz_id, question_text, question_type, media_attachments, correct_essay_answer) VALUES (?, ?, ?, ?, ?)", [quizId, question_text, question_type, JSON.stringify(media_attachments || []), essayAnswer || null] );
        const questionId = qResult.insertId;
        if (question_type.includes('pilihan-ganda') && options && Array.isArray(options)) {
            for (const opt of options) {
                 if (opt && typeof opt.text !== 'undefined' && typeof opt.isCorrect !== 'undefined') {
                    await conn.execute( "INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)", [questionId, opt.text, opt.isCorrect ? 1 : 0] ); // Pastikan isCorrect adalah 1 atau 0
                 } else { console.warn(`[WARN] Invalid option format skipped during addQuestion for quizId ${quizId}:`, opt); }
            }
        }
        await conn.commit();
        return { id: questionId, ...data };
    } catch (error) {
        await conn.rollback(); console.error(`[ERROR] Rollback during addQuestion for quizId ${quizId}:`, error); throw error;
    } finally { conn.release(); }
};

// === FUNGSI TAMBAH DARI BANK SOAL ===
Quiz.addQuestionsFromBank = async (quizId, questionIds) => {
    if (!questionIds || questionIds.length === 0) return 0;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        let questionsAdded = 0;
        for (const questionId of questionIds) {
            const [originalQuestions] = await conn.execute("SELECT * FROM questions WHERE id = ?", [questionId]);
            if (originalQuestions.length === 0) { console.warn(`[WARN] Soal bank dengan ID ${questionId} tidak ditemukan, dilewati.`); continue; }
            const originalQ = originalQuestions[0];
            const [newQResult] = await conn.execute( "INSERT INTO quiz_questions (quiz_id, question_text, question_type, correct_essay_answer, media_attachments) VALUES (?, ?, ?, ?, ?)", [quizId, originalQ.pertanyaan, originalQ.tipe_soal, originalQ.jawaban_esai, originalQ.media_urls]);
            const newQuizQuestionId = newQResult.insertId;
            if (originalQ.tipe_soal && originalQ.tipe_soal.includes('pilihan-ganda')) {
                const [originalOptions] = await conn.execute( "SELECT opsi_jawaban, is_correct FROM question_options WHERE question_id = ?", [questionId] );
                for (const opt of originalOptions) {
                    await conn.execute( "INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)", [newQuizQuestionId, opt.opsi_jawaban, opt.is_correct] );
                }
            }
            questionsAdded++;
        }
        await conn.commit();
        console.log(`[INFO] Successfully added ${questionsAdded} questions from bank to quizId ${quizId}.`);
        return questionsAdded;
    } catch (error) {
        await conn.rollback(); console.error(`[ERROR] Rollback during addQuestionsFromBank for quizId ${quizId}:`, error); throw error;
    } finally { conn.release(); }
};

// === FUNGSI HAPUS SOAL ===
Quiz.deleteQuestion = async (questionId) => {
    const [rows] = await db.execute("SELECT media_attachments FROM quiz_questions WHERE id = ?", [questionId]);
    if (rows.length > 0 && rows[0].media_attachments) {
        try {
            const media = JSON.parse(rows[0].media_attachments);
            media.forEach(item => { if (item.type === 'file' && item.url) { deleteFile(item.url); } });
        } catch(err) { console.error(`[ERROR] Failed to parse/delete media for question ${questionId}:`, err); }
    }
    const [result] = await db.execute("DELETE FROM quiz_questions WHERE id = ?", [questionId]);
    return result.affectedRows;
};

// === FUNGSI HAPUS KUIS ===
Quiz.delete = async (quizId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [quizRows] = await conn.execute("SELECT cover_image_url FROM quizzes WHERE id = ?", [quizId]);
        const [questionRows] = await conn.execute("SELECT id FROM quiz_questions WHERE quiz_id = ?", [quizId]);
        if (quizRows.length > 0) { deleteFile(quizRows[0].cover_image_url); }
        for (const q of questionRows) { await Quiz.deleteQuestion(q.id); }
        await conn.execute("DELETE FROM quiz_submissions WHERE quiz_id = ?", [quizId]); // Hapus submissions juga
        const [result] = await conn.execute("DELETE FROM quizzes WHERE id = ?", [quizId]);
        await conn.commit();
        return result.affectedRows;
    } catch (error) {
        await conn.rollback(); console.error(`[ERROR] Rollback during delete quizId ${quizId}:`, error); throw error;
    } finally { conn.release(); }
};

// === FUNGSI BUAT KUIS ===
Quiz.create = async (title, description, creatorId, coverImageUrl, recommendedLevel) => {
    const [result] = await db.execute( "INSERT INTO quizzes (title, description, creator_id, cover_image_url, recommended_level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())", [title, description || null, creatorId, coverImageUrl || null, recommended_level || 'Semua'] );
    return { id: result.insertId, title, description, creatorId, coverImageUrl, recommendedLevel };
};

// === FUNGSI DIPERBARUI: getAll ===
Quiz.getAll = async () => {
    const query = ` SELECT q.*, u.nama as creator_name, (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count FROM quizzes q JOIN users u ON q.creator_id = u.id ORDER BY q.created_at DESC `;
    const [rows] = await db.execute(query);
    return rows.map(quiz => ({
        ...quiz,
        setting_strict_scoring: !!quiz.setting_strict_scoring,
        setting_is_timer_enabled: !!quiz.setting_is_timer_enabled,
        setting_randomize_questions: !!quiz.setting_randomize_questions,
        setting_randomize_answers: !!quiz.setting_randomize_answers,
        setting_show_leaderboard: quiz.setting_show_leaderboard !== 0,
        setting_show_memes: quiz.setting_show_memes !== 0,
        setting_allow_redemption: !!quiz.setting_allow_redemption,
        setting_play_music: !!quiz.setting_play_music,
        setting_points_per_correct: quiz.setting_points_per_correct ?? 100,
        setting_time_per_question: quiz.setting_time_per_question ?? 20
    }));
};

// === FUNGSI DIPERBARUI: getQuestionsForQuiz ===
Quiz.getQuestionsForQuiz = async (quizId) => {
    const id = parseInt(quizId, 10);
    if (isNaN(id)) return { questions: [], settings: {} };
    const [quizRows] = await db.execute( "SELECT * FROM quizzes WHERE id = ?", [id] );
    if (quizRows.length === 0) return { questions: [], settings: {} };
    const quizData = quizRows[0];
    const settings = {
        setting_is_timer_enabled: !!quizData.setting_is_timer_enabled,
        setting_time_per_question: quizData.setting_time_per_question ?? 20,
        setting_randomize_questions: !!quizData.setting_randomize_questions,
        setting_randomize_answers: !!quizData.setting_randomize_answers,
        setting_show_leaderboard: quizData.setting_show_leaderboard !== 0,
        setting_show_memes: quizData.setting_show_memes !== 0,
        setting_allow_redemption: !!quizData.setting_allow_redemption,
    };
    const [questions] = await db.execute( "SELECT id, question_text, question_type, media_attachments FROM quiz_questions WHERE quiz_id = ?", [id] );
    for (const q of questions) {
        try { q.media_attachments = q.media_attachments ? JSON.parse(q.media_attachments) : []; } catch(e) { q.media_attachments = []; }
        if (q.question_type && q.question_type.includes('pilihan-ganda')) {
            const [options] = await db.execute( "SELECT id, option_text, is_correct FROM quiz_question_options WHERE question_id = ? ORDER BY id ASC", [q.id] );
            q.options = settings.setting_randomize_answers ? options.sort(() => Math.random() - 0.5) : options;
        }
    }
    const finalQuestions = settings.setting_randomize_questions ? questions.sort(() => Math.random() - 0.5) : questions;
    return { questions: finalQuestions, settings };
};

// === FUNGSI DIPERBARUI: getQuestionsForAdmin ===
Quiz.getQuestionsForAdmin = async (quizId) => {
    const id = parseInt(quizId, 10);
    if (isNaN(id)) return [];
    const [questions] = await db.execute( "SELECT id, question_text, question_type, correct_essay_answer, media_attachments FROM quiz_questions WHERE quiz_id = ?", [id] );
    for (const q of questions) {
        try { q.media_attachments = q.media_attachments ? JSON.parse(q.media_attachments) : []; } catch (e) { q.media_attachments = []; }
        if (q.question_type && q.question_type.includes('pilihan-ganda')) {
            const [options] = await db.execute( "SELECT id, option_text, is_correct FROM quiz_question_options WHERE question_id = ?", [q.id] );
            q.options = options;
        }
    }
    return questions;
};

// ==========================================================
// === FUNGSI SUBMIT KUIS DENGAN LOGGING TAMBAHAN ===
// ==========================================================
Quiz.submit = async (userId, quizId, answers) => {
    const numericQuizId = parseInt(quizId, 10);
    if (isNaN(numericQuizId)) throw new Error("Quiz ID tidak valid.");
    console.log(`[Quiz.submit] User: ${userId}, Quiz: ${numericQuizId}, Received Answers:`, JSON.stringify(answers));

    // 1. Ambil Pengaturan Kuis dari DB
    const [quizSettingsRows] = await db.execute(
        "SELECT setting_strict_scoring, setting_points_per_correct FROM quizzes WHERE id = ?", // Ambil kolom yang benar
        [numericQuizId]
    );
    if (quizSettingsRows.length === 0) {
        console.error(`[Quiz.submit] Quiz not found: ${numericQuizId}`);
        throw new Error("Kuis tidak ditemukan.");
    }
    const { setting_strict_scoring, setting_points_per_correct } = quizSettingsRows[0];
    const strictScoringEnabled = !!setting_strict_scoring;
    const pointsPerCorrectStrict = setting_points_per_correct || 100;
    console.log(`[Quiz.submit] Settings - Strict Scoring: ${strictScoringEnabled}, Points/Correct (Strict): ${pointsPerCorrectStrict}`);

    // 2. Tentukan Poin per Jawaban
    const pointsCorrectDefault = 50;
    const pointsIncorrectDefault = 25;
    const pointsCorrect = strictScoringEnabled ? pointsPerCorrectStrict : pointsCorrectDefault;
    const pointsIncorrect = strictScoringEnabled ? 0 : pointsIncorrectDefault;
    console.log(`[Quiz.submit] Points Logic - Correct: ${pointsCorrect}, Incorrect: ${pointsIncorrect}`);

    // 3. Ambil Kunci Jawaban (hanya untuk PG)
    const [correctAnswers] = await db.execute(`
        SELECT qq.id as question_id, qo.option_text as correct_option
        FROM quiz_questions qq JOIN quiz_question_options qo ON qq.id = qo.question_id
        WHERE qq.quiz_id = ? AND qo.is_correct = 1 AND qq.question_type LIKE '%pilihan-ganda%'
    `, [numericQuizId]);
    const answerMap = new Map(correctAnswers.map(ans => [ans.question_id, ans.correct_option]));
    console.log(`[Quiz.submit] Correct Answer Map size: ${answerMap.size}`);
    // console.log(`[Quiz.submit] Correct Answer Map content:`, answerMap); // Optional: log content if needed

    let totalPointsEarned = 0;
    let correctCount = 0;
    let pgQuestionCount = 0;

    // 4. Hitung Poin Berdasarkan Jawaban Siswa
    console.log(`[Quiz.submit] Calculating points for ${answers.length} answers...`);
    for (const ans of answers) {
        const questionId = parseInt(ans.questionId, 10);
        const userAnswer = ans.answer;
        const correctAnswer = answerMap.get(questionId); // Hanya akan ada jika soalnya PG
        console.log(`[Quiz.submit] QID: ${questionId}, User Answer: "${userAnswer}", Correct Answer (from map): "${correctAnswer}"`);

        let isCorrect = false;

        // Cek kebenaran HANYA jika soalnya PG (ada di answerMap)
        if (correctAnswer !== undefined) {
             pgQuestionCount++;
             // Handle null/undefined userAnswer, pastikan jadi string kosong
             const userTrimmedLower = userAnswer ? String(userAnswer).trim().toLowerCase() : "";
             const correctTrimmedLower = correctAnswer ? String(correctAnswer).trim().toLowerCase() : "";
             console.log(`[Quiz.submit] Comparing (PG): "${userTrimmedLower}" vs "${correctTrimmedLower}"`);
             isCorrect = userTrimmedLower === correctTrimmedLower;
            if (isCorrect) {
                correctCount++;
                console.log(`[Quiz.submit] --> Correct! Adding ${pointsCorrect} points.`);
                totalPointsEarned += pointsCorrect;
            } else {
                 console.log(`[Quiz.submit] --> Incorrect (PG). Adding ${pointsIncorrect} points.`);
                 totalPointsEarned += pointsIncorrect;
            }
        } else {
             // Ini adalah soal esai ATAU soal PG yang tidak ada kunci jawabannya di map (seharusnya tidak terjadi jika data benar)
             console.log(`[Quiz.submit] --> Essay or PG without key. Adding ${pointsIncorrect} points.`);
             totalPointsEarned += pointsIncorrect; // Beri poin untuk jawaban salah/esai
        }
    }
    totalPointsEarned = Math.max(0, totalPointsEarned); // Pastikan tidak negatif
    console.log(`[Quiz.submit] Total Points Calculated: ${totalPointsEarned}, Correct Count: ${correctCount}, PG Count: ${pgQuestionCount}`);

    // Hitung Skor Persentase (hanya berdasarkan soal PG)
    const percentageScore = pgQuestionCount > 0 ? Math.round((correctCount / pgQuestionCount) * 100) : 0; // Skor 0 jika tidak ada soal PG
    console.log(`[Quiz.submit] Percentage Score Calculated: ${percentageScore}`);

    // 5. Simpan Hasil Submission ke DB
    console.log(`[Quiz.submit] Saving submission - User: ${userId}, Quiz: ${numericQuizId}, Score: ${percentageScore}, Points Earned: ${totalPointsEarned}`);
    const [result] = await db.execute( "INSERT INTO quiz_submissions (user_id, quiz_id, score, points_earned, submitted_at) VALUES (?, ?, ?, ?, NOW())", [userId, numericQuizId, percentageScore, totalPointsEarned] );
    console.log(`[Quiz.submit] Submission saved. Insert ID: ${result.insertId}`);

    // 6. Kembalikan ID submission, total poin, dan skor persentase
    return { submissionId: result.insertId, pointsEarned: totalPointsEarned, score: percentageScore };
};

// === FUNGSI DIPERBARUI: getSubmissionsByQuizId ===
Quiz.getSubmissionsByQuizId = async (quizId) => {
    const numericQuizId = parseInt(quizId, 10);
    if (isNaN(numericQuizId)) return [];
    const query = ` SELECT qs.id, qs.score, qs.points_earned, qs.submitted_at as submission_date, u.nama as student_name FROM quiz_submissions qs JOIN users u ON qs.user_id = u.id WHERE qs.quiz_id = ? ORDER BY qs.points_earned DESC, qs.score DESC, qs.submitted_at ASC `;
    const [rows] = await db.execute(query, [numericQuizId]);
    return rows.map(row => ({ ...row, score: row.score ?? 0, points_earned: row.points_earned ?? 0 })); // Fallback null ke 0
};

module.exports = Quiz;