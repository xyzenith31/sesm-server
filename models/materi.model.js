// contoh-server-sesm/models/materi.model.js
const db = require("../config/database.config.js");
const fs = require('fs');
const path = require('path');

const Materi = {};

// Fungsi untuk mengecek apakah user sudah menyelesaikan chapter
Materi.checkCompletionStatus = async (userId, chapterId) => {
    const [rows] = await db.execute(
        "SELECT id FROM student_submissions WHERE user_id = ? AND chapter_id = ? AND status IN ('selesai', 'dinilai') LIMIT 1",
        [userId, chapterId]
    );
    return rows.length > 0;
};


// --- FUNGSI BARU UNTUK MENAMBAH SOAL DARI BANK KE MATERI ---
Materi.addQuestionsFromBankToChapter = async (materiKey, questionIds) => {
    if (!questionIds || questionIds.length === 0) {
        return 0;
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [chapters] = await conn.execute("SELECT id FROM chapters WHERE materiKey = ?", [materiKey]);
        if (chapters.length === 0) {
            throw new Error(`Materi dengan key '${materiKey}' tidak ditemukan.`);
        }
        const chapterId = chapters[0].id;

        let questionsAdded = 0;
        for (const questionId of questionIds) {
            const [originalQuestions] = await conn.execute("SELECT * FROM questions WHERE id = ?", [questionId]);
            if (originalQuestions.length === 0) {
                console.warn(`Soal dengan ID ${questionId} tidak ditemukan di bank soal, dilewati.`);
                continue;
            }
            const originalQ = originalQuestions[0];

            const [newQResult] = await conn.execute(
                "INSERT INTO questions (pertanyaan, tipe_soal, jawaban_esai, chapter_id, media_urls) VALUES (?, ?, ?, ?, ?)",
                [originalQ.pertanyaan, originalQ.tipe_soal, originalQ.jawaban_esai, chapterId, originalQ.media_urls]
            );
            const newQuestionId = newQResult.insertId;

            if (originalQ.tipe_soal.includes('pilihan-ganda')) {
                const [originalOptions] = await conn.execute("SELECT * FROM question_options WHERE question_id = ?", [questionId]);
                for (const opt of originalOptions) {
                    await conn.execute(
                        "INSERT INTO question_options (opsi_jawaban, is_correct, question_id) VALUES (?, ?, ?)",
                        [opt.opsi_jawaban, opt.is_correct, newQuestionId]
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

// --- FUNGSI BARU UNTUK UPDATE PENGATURAN ---
Materi.updateChapterSettings = async (chapterId, settings) => {
    const fields = [];
    const values = [];

    const validSettings = [
        'setting_penalty_on_wrong',
        'setting_randomize_questions',
        'setting_show_correct_answers',
        'setting_time_limit_minutes',
        'setting_require_all_answers',
        'setting_strict_zero_on_wrong',
        'setting_fail_on_any_wrong'
    ];

    for (const key in settings) {
        if (validSettings.includes(key)) {
            fields.push(`${key} = ?`);
            if (key === 'setting_time_limit_minutes' && (settings[key] === '' || settings[key] === null)) {
                values.push(null);
            } else {
                const valueToSave = typeof settings[key] === 'boolean' ? (settings[key] ? 1 : 0) : settings[key];
                values.push(valueToSave);
            }
        }
    }

    if (fields.length === 0) {
        return { affectedRows: 0 };
    }

    const query = `UPDATE chapters SET ${fields.join(", ")} WHERE id = ?`;
    values.push(chapterId);

    const [result] = await db.execute(query, values);
    return result;
};

// --- FUNGSI LAMA YANG DIPERBARUI UNTUK MEMUAT DATA PENGATURAN ---
Materi.getAdminDashboardData = async (jenjang, kelas) => {
    let query = `
        SELECT
            s.id as subject_id,
            s.nama_mapel,
            c.id as chapter_id,
            c.judul as chapter_judul,
            c.materiKey,
            c.grading_mode,
            c.setting_penalty_on_wrong,
            c.setting_randomize_questions,
            c.setting_show_correct_answers,
            c.setting_time_limit_minutes,
            c.setting_require_all_answers,
            c.setting_strict_zero_on_wrong,
            c.setting_fail_on_any_wrong,
            (SELECT COUNT(*) FROM questions q WHERE q.chapter_id = c.id) as jumlah_soal
        FROM subjects s
        LEFT JOIN chapters c ON s.id = c.subject_id
        WHERE s.jenjang = ?
    `;
    const params = [jenjang];
    if (jenjang.toUpperCase() === 'SD' && kelas) {
        query += " AND s.kelas = ?";
        params.push(kelas);
    } else if (jenjang.toUpperCase() === 'TK') {
        query += " AND s.kelas IS NULL";
    }
     query += " ORDER BY s.nama_mapel, c.judul";
    const [rows] = await db.execute(query, params);

    const result = {};
    rows.forEach(row => {
        if (!row.nama_mapel) return;
        if (!result[row.nama_mapel]) {
            result[row.nama_mapel] = {
                subject_id: row.subject_id,
                chapters: []
            };
        }
        if (row.chapter_id) {
            result[row.nama_mapel].chapters.push({
                chapter_id: row.chapter_id,
                judul: row.chapter_judul,
                materiKey: row.materiKey,
                grading_mode: row.grading_mode,
                questionCount: row.jumlah_soal,
                settings: {
                    setting_penalty_on_wrong: !!row.setting_penalty_on_wrong,
                    setting_randomize_questions: !!row.setting_randomize_questions,
                    setting_show_correct_answers: !!row.setting_show_correct_answers,
                    setting_time_limit_minutes: row.setting_time_limit_minutes,
                    setting_require_all_answers: !!row.setting_require_all_answers,
                    setting_strict_zero_on_wrong: !!row.setting_strict_zero_on_wrong,
                    setting_fail_on_any_wrong: !!row.setting_fail_on_any_wrong,
                }
            });
        }
    });
    return result;
};

Materi.updateQuestion = async (questionId, questionData) => {
    const { type, question, options, correctAnswer, essayAnswer, media_urls } = questionData;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const mediaUrlsJson = JSON.stringify(media_urls || []);
        await conn.execute(
            "UPDATE questions SET pertanyaan = ?, tipe_soal = ?, jawaban_esai = ?, media_urls = ? WHERE id = ?",
            [question, type, essayAnswer || null, mediaUrlsJson, questionId]
        );
        if (type.startsWith('pilihan-ganda') && options) {
            await conn.execute("DELETE FROM question_options WHERE question_id = ?", [questionId]);
            for (const opt of options) {
                const optionText = typeof opt === 'string' ? opt.trim() : '';
                const isCorrect = optionText === (correctAnswer || '').trim();
                await conn.execute("INSERT INTO question_options (opsi_jawaban, is_correct, question_id) VALUES (?, ?, ?)",
                    [optionText, isCorrect, questionId]
                );
            }
        } else {
             await conn.execute("DELETE FROM question_options WHERE question_id = ?", [questionId]);
        }
        await conn.commit();
        return { id: questionId, ...questionData };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

Materi.getAllQuestionsForBank = async (jenjang, kelas) => {
    let query = `
        SELECT
            q.id,
            q.pertanyaan,
            q.tipe_soal,
            c.judul as chapter_judul,
            s.nama_mapel
        FROM questions q
        JOIN chapters c ON q.chapter_id = c.id
        JOIN subjects s ON c.subject_id = s.id
        WHERE s.jenjang = ?
    `;
    const params = [jenjang];
    if (jenjang.toUpperCase() === 'SD' && kelas) {
        query += " AND s.kelas = ?";
        params.push(kelas);
    } else if (jenjang.toUpperCase() === 'TK') {
        query += " AND s.kelas IS NULL";
    }
    query += " ORDER BY s.nama_mapel, c.judul, q.id";
    const [rows] = await db.execute(query, params);
    return rows;
};

// --- FUNGSI DIPERBARUI: Menambahkan JOIN ke users ---
Materi.findChapterByMateriKey = async (materiKey) => {
    const [rows] = await db.execute(`
        SELECT
            c.*, c.id as chapter_id,
            u.nama as creator_name,
            u.avatar as creator_avatar
        FROM chapters c
        LEFT JOIN users u ON c.creator_id = u.id  -- Menggunakan LEFT JOIN jika creator_id bisa NULL
        WHERE c.materiKey = ?
    `, [materiKey]);
    return rows[0];
};

Materi.checkQuestionExists = async (questionId) => {
    const [rows] = await db.execute("SELECT id FROM questions WHERE id = ?", [questionId]);
    return rows.length > 0;
};

Materi.getQuestionsByChapterKey = async (materiKey) => {
    const query = `
        SELECT q.id, q.pertanyaan, q.tipe_soal, q.jawaban_esai, q.media_urls
        FROM questions q
        JOIN chapters c ON q.chapter_id = c.id
        WHERE c.materiKey = ?
    `;
    const [questions] = await db.execute(query, [materiKey]);
    for (const q of questions) {
        if (q.media_urls) {
            try { q.media_urls = JSON.parse(q.media_urls); } catch (e) { q.media_urls = []; console.error(`Failed to parse media_urls for question ${q.id}: ${q.media_urls}`); }
        } else {
            q.media_urls = [];
        }

        if (q.tipe_soal.includes('pilihan-ganda')) {
            const [options] = await db.execute(
                "SELECT opsi_jawaban, is_correct FROM question_options WHERE question_id = ?",
                [q.id]
            );
            q.options = options.map(opt => opt.opsi_jawaban);
            const correctOption = options.find(opt => opt.is_correct);
            q.correctAnswer = correctOption ? correctOption.opsi_jawaban : null;
        } else {
            delete q.options;
            delete q.correctAnswer;
        }
    }
    return questions;
};

// --- FUNGSI DIPERBARUI: Menambahkan JOIN ke users dan subquery/JOIN untuk status penyelesaian ---
Materi.findChaptersBySubjectName = async (jenjang, kelas, namaMapel, userId) => {
    let query = `
        SELECT
            c.id, c.judul, c.materiKey,
            u.nama as creator_name,
            u.avatar as creator_avatar,
            -- Subquery untuk mengecek status penyelesaian
            EXISTS (
                SELECT 1
                FROM student_submissions ss
                WHERE ss.chapter_id = c.id AND ss.user_id = ? AND ss.status IN ('selesai', 'dinilai')
            ) as hasCompleted
        FROM chapters c
        JOIN subjects s ON c.subject_id = s.id
        LEFT JOIN users u ON c.creator_id = u.id -- Bergabung dengan tabel users
        WHERE s.jenjang = ? AND s.nama_mapel = ?
    `;
    // Parameter untuk subquery (userId) ditambahkan di awal
    const params = [userId, jenjang, namaMapel];

    if (jenjang.toUpperCase() === 'SD' && kelas) { // Pastikan kelas ditambahkan jika SD
        query += " AND s.kelas = ?";
        params.push(kelas);
    } else if (jenjang.toUpperCase() === 'TK') { // Pastikan hanya data TK yang diambil
        query += " AND s.kelas IS NULL";
    }
    // Tambahkan ORDER BY jika diperlukan
    query += " ORDER BY c.judul ASC";

    const [rows] = await db.execute(query, params);
    // Konversi hasCompleted ke boolean
    return rows.map(row => ({ ...row, hasCompleted: !!row.hasCompleted }));
};

Materi.createChapter = async (judul, subjectId, creatorId) => { // Tambahkan creatorId
    const [subjects] = await db.execute("SELECT jenjang, kelas, nama_mapel FROM subjects WHERE id = ?", [subjectId]);
    if (subjects.length === 0) throw new Error("Subject ID tidak ditemukan.");
    const { jenjang, kelas, nama_mapel } = subjects[0];
    const safeMapelName = nama_mapel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const timestamp = Date.now();
    const materiKey = `${jenjang.toLowerCase()}${kelas || ''}-${safeMapelName}-${timestamp}`;

    const [result] = await db.execute(
        // Tambahkan creator_id ke INSERT
        "INSERT INTO chapters (judul, materiKey, subject_id, creator_id) VALUES (?, ?, ?, ?)",
        [judul, materiKey, subjectId, creatorId] // Masukkan creatorId
    );
    return { id: result.insertId, judul, materiKey, subjectId };
};

Materi.createQuestion = async (materiKey, questionData) => {
    const [chapters] = await db.execute("SELECT id FROM chapters WHERE materiKey = ?", [materiKey]);
    if (chapters.length === 0) throw new Error("Chapter not found");
    const chapterId = chapters[0].id;
    const { type, question, options, correctAnswer, essayAnswer, media_urls } = questionData;
    const mediaUrlsJson = JSON.stringify(media_urls || []);
    const [result] = await db.execute(
        "INSERT INTO questions (pertanyaan, tipe_soal, jawaban_esai, chapter_id, media_urls) VALUES (?, ?, ?, ?, ?)",
        [question, type, essayAnswer || null, chapterId, mediaUrlsJson]
    );
    const questionId = result.insertId;
    if (type.startsWith('pilihan-ganda') && options && Array.isArray(options)) {
        for (const opt of options) {
             const optionText = typeof opt === 'string' ? opt.trim() : '';
             const isCorrect = optionText === (correctAnswer || '').trim();
            await db.execute(
                "INSERT INTO question_options (opsi_jawaban, is_correct, question_id) VALUES (?, ?, ?)",
                [optionText, isCorrect, questionId]
            );
        }
    }
    return { id: questionId, ...questionData };
};

Materi.deleteChapter = async (materiKey) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [chapters] = await conn.execute("SELECT id FROM chapters WHERE materiKey = ?", [materiKey]);
        if (chapters.length > 0) {
            const chapterId = chapters[0].id;
            const [questions] = await conn.execute("SELECT id FROM questions WHERE chapter_id = ?", [chapterId]);
            for (const q of questions) {
                await Materi.deleteQuestion(q.id);
            }
        }

        const [result] = await conn.execute("DELETE FROM chapters WHERE materiKey = ?", [materiKey]);

        await conn.commit();
        return result.affectedRows;
    } catch (error) {
        await conn.rollback();
        console.error("Error deleting chapter and related questions:", error);
        throw error;
    } finally {
        conn.release();
    }
};

Materi.deleteQuestion = async (questionId) => {
    const [rows] = await db.execute("SELECT media_urls FROM questions WHERE id = ?", [questionId]);
    if (rows.length > 0 && rows[0].media_urls) {
        try {
            const mediaUrls = JSON.parse(rows[0].media_urls);
            mediaUrls.forEach(item => {
                if (item.type === 'file' && item.url) {
                    const filePath = path.join(__dirname, '..', item.url);
                    if (fs.existsSync(filePath)) {
                        fs.unlink(filePath, (err) => {
                            if (err) console.error(`Async unlink failed for ${filePath}:`, err);
                        });
                    }
                }
            });
        } catch(err) {
            console.error("Gagal memproses media_urls saat menghapus:", err);
        }
    }
    const [result] = await db.execute("DELETE FROM questions WHERE id = ?", [questionId]);
    return result.affectedRows;
};

Materi.updateGradingMode = async (chapterId, mode) => {
    const [result] = await db.execute(
        "UPDATE chapters SET grading_mode = ? WHERE id = ?",
        [mode, chapterId]
    );
    return result.affectedRows;
};

Materi.createSubmission = async (userId, chapterId, score, isSystemGraded, status) => {
    const [result] = await db.execute(
        "INSERT INTO student_submissions (user_id, chapter_id, score, is_graded_by_system, status, submission_date) VALUES (?, ?, ?, ?, ?, NOW())",
        [userId, chapterId, score, isSystemGraded ? 1 : 0, status]
    );
    return result.insertId;
};

Materi.saveStudentAnswer = async (submissionId, questionId, answerText, isCorrect) => {
    await db.execute(
        "INSERT INTO student_answers (submission_id, question_id, answer_text, is_correct) VALUES (?, ?, ?, ?)",
        [submissionId, questionId, answerText, isCorrect]
    );
};

Materi.getAllSubmissionsForChapter = async (chapterId) => {
    const [rows] = await db.execute(`
        SELECT
            ss.id,
            u.nama as student_name,
            ss.submission_date,
            ss.score,
            ss.status,
            ss.is_graded_by_system
        FROM student_submissions ss
        JOIN users u ON ss.user_id = u.id
        WHERE ss.chapter_id = ?
        ORDER BY ss.status ASC, ss.submission_date DESC
    `, [chapterId]);
    // Konversi is_graded_by_system ke boolean
    return rows.map(row => ({...row, is_graded_by_system: !!row.is_graded_by_system}));
};


Materi.getSubmissionDetails = async (submissionId) => {
    const [rows] = await db.execute(`
        SELECT
            q.pertanyaan,
            q.tipe_soal,
            sa.id as answerId,
            sa.answer_text,
            sa.is_correct,
            sa.correction_text,
            q.jawaban_esai AS correct_essay,
            (SELECT qo.opsi_jawaban FROM question_options qo WHERE qo.question_id = q.id AND qo.is_correct = 1 LIMIT 1) AS correct_mcq
        FROM student_answers sa
        JOIN questions q ON sa.question_id = q.id
        WHERE sa.submission_id = ?
        ORDER BY q.id ASC
    `, [submissionId]);
    return rows.map(row => ({
        ...row,
        is_correct: row.is_correct === null ? null : !!row.is_correct
    }));
};

Materi.updateAnswerDetails = async (answerId, { correction_text }) => {
    const [result] = await db.execute(
        "UPDATE student_answers SET correction_text = ? WHERE id = ?",
        [correction_text, answerId]
    );
    return result.affectedRows;
};

Materi.gradeSubmissionManually = async (submissionId, score) => {
    // Hanya update skor dan ubah status menjadi 'dinilai'
    const [result] = await db.execute(
        "UPDATE student_submissions SET score = ?, status = 'dinilai' WHERE id = ?",
        [score, submissionId]
    );
    return result.affectedRows;
};

// Fungsi ini hanya mengubah status is_correct
Materi.overrideAnswerCorrectness = async (answerId, isCorrect) => {
    const [result] = await db.execute(
        "UPDATE student_answers SET is_correct = ? WHERE id = ?",
        [isCorrect ? 1 : 0, answerId] // Konversi boolean ke 1/0
    );
    return result.affectedRows;
};

Materi.getSubmissionIdFromAnswer = async (answerId) => {
    const [rows] = await db.execute("SELECT submission_id FROM student_answers WHERE id = ?", [answerId]);
    return rows[0]?.submission_id;
};

Materi.recalculateScore = async (submissionId) => {
    const [submissionInfo] = await db.execute(
        `SELECT c.id as chapter_id
         FROM student_submissions ss
         JOIN chapters c ON ss.chapter_id = c.id
         WHERE ss.id = ?`, [submissionId]
    );
    if (!submissionInfo.length) return 0;

    const chapterId = submissionInfo[0].chapter_id;

    const [mcCountResult] = await db.execute(
        "SELECT COUNT(*) as totalMc FROM questions WHERE chapter_id = ? AND tipe_soal LIKE '%pilihan-ganda%'",
        [chapterId]
    );
    const totalMcQuestions = mcCountResult[0].totalMc;

    const [correctCountResult] = await db.execute(
        `SELECT COUNT(sa.id) as correctCount
         FROM student_answers sa
         JOIN questions q ON sa.question_id = q.id
         WHERE sa.submission_id = ? AND sa.is_correct = 1 AND q.tipe_soal LIKE '%pilihan-ganda%'`,
        [submissionId]
    );
    const correctMcCount = correctCountResult[0].correctCount;

    const newScore = totalMcQuestions > 0 ? Math.round((correctMcCount / totalMcQuestions) * 100) : 0;

    await db.execute("UPDATE student_submissions SET score = ? WHERE id = ?", [newScore, submissionId]);

    return newScore;
};

Materi.findSubmissionByIdForStudent = async (submissionId, userId) => {
    const [rows] = await db.execute(
        "SELECT * FROM student_submissions WHERE id = ? AND user_id = ?",
        [submissionId, userId]
    );
    return rows[0];
};

module.exports = Materi;