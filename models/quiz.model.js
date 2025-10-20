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

// === FUNGSI DIPERBARUI: updateSettings (Menambah setting_allow_repeat_points) ===
Quiz.updateSettings = async (quizId, settings) => {
    const validSettings = [
        'setting_time_per_question', 'setting_randomize_questions', 'setting_randomize_answers',
        'setting_show_leaderboard', 'setting_show_memes', 'setting_allow_redemption',
        'setting_play_music', 'setting_is_timer_enabled', 'setting_strict_scoring',
        'setting_points_per_correct', 'setting_allow_repeat_points' // <-- Tambahkan setting baru
    ];
    const fields = [];
    const values = [];

    for (const key in settings) {
        if (validSettings.includes(key)) {
            fields.push(`${key} = ?`);
            let value = settings[key];
            // Konversi boolean ke 0/1 untuk database
            if (typeof value === 'boolean') { value = value ? 1 : 0; }
            // Validasi dan default untuk poin
            if (key === 'setting_points_per_correct') {
                value = parseInt(value, 10);
                if (isNaN(value) || value <= 0) { value = 100; }
            }
            // Validasi dan null handling untuk waktu
            if (key === 'setting_time_per_question') {
                if (!settings.setting_is_timer_enabled) { value = null; } // Set null jika timer tidak aktif
                else {
                     value = parseInt(value, 10);
                     if (isNaN(value) || value < 5 || value > 300) { value = 20; }
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


// === FUNGSI DIPERBARUI: findById (Menambah setting_allow_repeat_points) ===
Quiz.findById = async (quizId) => {
    // Pastikan kolom baru diambil
    const [rows] = await db.execute(
        "SELECT title, setting_strict_scoring, setting_points_per_correct, setting_allow_repeat_points FROM quizzes WHERE id = ?",
        [quizId]
    );
    return rows[0] ? {
        title: rows[0].title,
        strictScoringEnabled: !!rows[0].setting_strict_scoring,
        pointsPerCorrectStrict: rows[0].setting_points_per_correct || 100,
        allowRepeatPoints: !!rows[0].setting_allow_repeat_points // <-- Tambahkan ini
     } : null;
};

// === FUNGSI BARU: Check if User has Submitted Quiz ===
Quiz.checkIfSubmitted = async (userId, quizId) => {
    const [rows] = await db.execute(
        "SELECT id FROM quiz_submissions WHERE user_id = ? AND quiz_id = ? LIMIT 1",
        [userId, quizId]
    );
    return rows.length > 0;
};


// === FUNGSI DIPERBARUI: getAll (JOIN ke users) ===
Quiz.getAll = async () => {
    // --- JOIN users table and select creator name and avatar ---
    const query = `
        SELECT
            q.*,
            u.nama as creator_name,
            u.avatar as creator_avatar,
            (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count
        FROM quizzes q
        JOIN users u ON q.creator_id = u.id
        ORDER BY q.created_at DESC
    `;
    const [rows] = await db.execute(query);
    // Konversi nilai 0/1 dari DB ke boolean untuk frontend
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
        setting_time_per_question: quiz.setting_time_per_question ?? 20,
        setting_allow_repeat_points: !!quiz.setting_allow_repeat_points // <-- Tambahkan konversi
    }));
};

// === FUNGSI SUBMIT (Hanya Kalkulasi & Simpan, Poin dipindah ke Controller) ===
Quiz.submit = async (userId, quizId, answers) => {
    const numericQuizId = parseInt(quizId, 10);
    if (isNaN(numericQuizId)) throw new Error("Quiz ID tidak valid.");
    console.log(`\n\n[Quiz.submit V2 START] User: ${userId}, Quiz: ${numericQuizId}, Number of Answers: ${answers.length}`);

    // --- Langkah 1: Ambil Pengaturan Kuis ---
    console.log(`[Quiz.submit V2] Fetching quiz settings...`);
    const [quizSettingsRows] = await db.execute(
        "SELECT setting_strict_scoring, setting_points_per_correct FROM quizzes WHERE id = ?",
        [numericQuizId]
    );
    if (quizSettingsRows.length === 0) {
        console.error(`[Quiz.submit V2 ERROR] Quiz ${numericQuizId} not found in database.`);
        throw new Error("Kuis tidak ditemukan.");
    }
    const { setting_strict_scoring, setting_points_per_correct } = quizSettingsRows[0];
    const strictScoringEnabled = !!setting_strict_scoring;
    const pointsPerCorrectStrict = parseInt(setting_points_per_correct, 10) > 0 ? parseInt(setting_points_per_correct, 10) : 100;
    console.log(`[Quiz.submit V2] Settings Fetched - Strict Mode: ${strictScoringEnabled}, Points/Correct (Strict): ${pointsPerCorrectStrict}`);

    // --- Langkah 2: Tentukan Skema Poin ---
    const pointsCorrectDefault = 50;
    const pointsIncorrectDefault = 25;
    const pointsCorrect = strictScoringEnabled ? pointsPerCorrectStrict : pointsCorrectDefault;
    const pointsIncorrect = strictScoringEnabled ? 0 : pointsIncorrectDefault;
    console.log(`[Quiz.submit V2] Point Scheme - Correct: ${pointsCorrect}, Incorrect/Essay: ${pointsIncorrect}`);

    // --- Langkah 3: Ambil Kunci Jawaban Pilihan Ganda ---
    console.log(`[Quiz.submit V2] Fetching correct answers map...`);
    const [correctAnswers] = await db.execute(`
        SELECT qq.id as question_id, qo.option_text as correct_option
        FROM quiz_questions qq JOIN quiz_question_options qo ON qq.id = qo.question_id
        WHERE qq.quiz_id = ? AND qo.is_correct = 1 AND qq.question_type LIKE '%pilihan-ganda%'
    `, [numericQuizId]);
    const answerMap = new Map(correctAnswers.map(ans => [ans.question_id, ans.correct_option]));
    console.log(`[Quiz.submit V2] Correct Answer Map created with ${answerMap.size} entries.`);

    // --- Langkah 4: Iterasi dan Hitung Poin ---
    let totalPointsEarned = 0;
    let correctMcCount = 0;
    let totalMcQuestions = 0;
    console.log(`[Quiz.submit V2] Starting answer processing loop...`);

    for (let i = 0; i < answers.length; i++) {
        const ans = answers[i];
        const questionId = parseInt(ans.questionId, 10);
        const userAnswer = (ans.answer === null || ans.answer === undefined) ? "" : String(ans.answer);
        const correctAnswerKey = answerMap.get(questionId);
        const isMcQuestion = correctAnswerKey !== undefined;

        console.log(`\n[Quiz.submit V2 LOOP ${i + 1}/${answers.length}] ---- Processing Question ID: ${questionId} ----`);
        // ... (Logging lainnya bisa ditambahkan kembali jika perlu) ...

        let pointsForThisQuestion = 0;
        let isCorrect = false;

        if (isMcQuestion) {
            totalMcQuestions++;
            const userTrimmedLower = userAnswer.trim().toLowerCase();
            const correctTrimmedLower = correctAnswerKey.trim().toLowerCase();
            isCorrect = userTrimmedLower === correctTrimmedLower;

            if (isCorrect) {
                pointsForThisQuestion = pointsCorrect;
                correctMcCount++;
            } else {
                pointsForThisQuestion = pointsIncorrect;
            }
        } else {
            // Esai
            pointsForThisQuestion = pointsIncorrect;
        }

        totalPointsEarned += pointsForThisQuestion;
        console.log(`  Points Added This Question: ${pointsForThisQuestion}, Running Total: ${totalPointsEarned}`);
        console.log(`[Quiz.submit V2 LOOP ${i + 1}/${answers.length}] ---- END Processing Question ID: ${questionId} ----`);
    }

    console.log(`\n[Quiz.submit V2] Loop finished.`);
    totalPointsEarned = Math.max(0, totalPointsEarned);
    console.log(`[Quiz.submit V2] Final Calculated Points: ${totalPointsEarned}`);

    // --- Langkah 5: Hitung Skor Persentase (berdasarkan soal PG saja) ---
    const percentageScore = totalMcQuestions > 0 ? Math.round((correctMcCount / totalMcQuestions) * 100) : 0;
    console.log(`[Quiz.submit V2] Calculated Percentage Score: ${percentageScore}%`);

    // --- Langkah 6: Simpan Submission ke Database ---
    console.log(`[Quiz.submit V2] Saving submission to database...`);
    const [result] = await db.execute(
        "INSERT INTO quiz_submissions (user_id, quiz_id, score, points_earned, submitted_at) VALUES (?, ?, ?, ?, NOW())",
        [userId, numericQuizId, percentageScore, totalPointsEarned]
    );
    const submissionId = result.insertId;
    console.log(`[Quiz.submit V2] Submission saved successfully. ID: ${submissionId}`);

    // --- Langkah 7: Kembalikan Hasil ---
    const finalResult = {
        submissionId: submissionId,
        pointsEarned: totalPointsEarned, // Poin total yang DIHITUNG di backend
        score: percentageScore
    };
    console.log(`[Quiz.submit V2 END] Returning result:`, JSON.stringify(finalResult));
    return finalResult;
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
        for (const q of questionRows) { await Quiz.deleteQuestion(q.id); } // Memanggil fungsi deleteQuestion yang sudah ada
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
    const query = `
        INSERT INTO quizzes
        (title, description, creator_id, cover_image_url, recommended_level, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
        title,
        description || null,
        creatorId,
        coverImageUrl || null,
        recommendedLevel || 'Semua'
    ];

    console.log("[DEBUG] Quiz.create - Executing query:", query);
    console.log("[DEBUG] Quiz.create - With params:", params);

    try {
        const [result] = await db.execute(query, params);
        console.log("[DEBUG] Quiz.create - Insert result:", result);
        if (result.insertId) {
            return { id: result.insertId, title, description, creatorId, coverImageUrl, recommendedLevel };
        } else {
            throw new Error("Gagal mendapatkan ID kuis yang baru dibuat.");
        }
    } catch (dbError) {
        console.error("[FATAL] Quiz.create - Database error:", dbError);
        throw dbError;
    }
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
        // setting_play_music tidak relevan untuk siswa, mungkin?
    };
    const [questions] = await db.execute( "SELECT id, question_text, question_type, media_attachments FROM quiz_questions WHERE quiz_id = ?", [id] );
    for (const q of questions) {
        try { q.media_attachments = q.media_attachments ? JSON.parse(q.media_attachments) : []; } catch(e) { q.media_attachments = []; }
        if (q.question_type && q.question_type.includes('pilihan-ganda')) {
            // Hanya ambil teks opsi untuk siswa
            const [options] = await db.execute( "SELECT option_text FROM quiz_question_options WHERE question_id = ? ORDER BY id ASC", [q.id] );
            q.options = settings.setting_randomize_answers ? options.map(o => o.option_text).sort(() => Math.random() - 0.5) : options.map(o => o.option_text);
        }
    }
    const finalQuestions = settings.setting_randomize_questions ? questions.sort(() => Math.random() - 0.5) : questions;
    // Mengambil info creator
    const [creatorInfo] = await db.execute("SELECT u.nama as creator_name, u.avatar as creator_avatar FROM users u JOIN quizzes q ON u.id = q.creator_id WHERE q.id = ?", [id]);

    return {
        questions: finalQuestions,
        settings,
        creatorInfo: creatorInfo[0] || {} // Kirim info creator
    };
};

// === FUNGSI DIPERBARUI: getQuestionsForAdmin ===
Quiz.getQuestionsForAdmin = async (quizId) => {
    const id = parseInt(quizId, 10);
    if (isNaN(id)) return [];
    // Ambil juga correct_essay_answer
    const [questions] = await db.execute( "SELECT id, question_text, question_type, correct_essay_answer, media_attachments FROM quiz_questions WHERE quiz_id = ?", [id] );
    for (const q of questions) {
        try { q.media_attachments = q.media_attachments ? JSON.parse(q.media_attachments) : []; } catch (e) { q.media_attachments = []; }
        if (q.question_type && q.question_type.includes('pilihan-ganda')) {
            // Ambil detail opsi termasuk is_correct
            const [options] = await db.execute( "SELECT id, option_text, is_correct FROM quiz_question_options WHERE question_id = ?", [q.id] );
            q.options = options;
        }
    }
    return questions;
};


// === FUNGSI DIPERBARUI: getSubmissionsByQuizId ===
Quiz.getSubmissionsByQuizId = async (quizId) => {
    const numericQuizId = parseInt(quizId, 10);
    if (isNaN(numericQuizId)) return [];
    const query = `
        SELECT
            qs.id,
            qs.score,
            qs.points_earned,
            qs.submitted_at as submission_date,
            u.nama as student_name
        FROM quiz_submissions qs
        JOIN users u ON qs.user_id = u.id
        WHERE qs.quiz_id = ?
        ORDER BY qs.points_earned DESC, qs.score DESC, qs.submitted_at ASC
    `;
    const [rows] = await db.execute(query, [numericQuizId]);
    // Fallback nilai null ke 0 agar konsisten
    return rows.map(row => ({
        ...row,
        score: row.score ?? 0,
        points_earned: row.points_earned ?? 0
    }));
};

module.exports = Quiz;