// contoh-server-sesm/models/materi.model.js

const db = require("../config/database.config.js");

const Materi = {};

// === FUNGSI BARU UNTUK VALIDASI ===
Materi.findChapterByMateriKey = async (materiKey) => {
    const [rows] = await db.execute("SELECT id, grading_mode FROM chapters WHERE materiKey = ?", [materiKey]);
    return rows[0];
};

Materi.checkQuestionExists = async (questionId) => {
    const [rows] = await db.execute("SELECT id FROM questions WHERE id = ?", [questionId]);
    return rows.length > 0;
};


// === Operasi READ (kode lainnya tidak berubah) ===
Materi.getAdminDashboardData = async (jenjang, kelas) => {
    let query = `
        SELECT 
            s.id as subject_id,
            s.nama_mapel, 
            c.id as chapter_id, 
            c.judul as chapter_judul,
            c.materiKey,
            c.grading_mode, 
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
                questionCount: row.jumlah_soal
            });
        }
    });
    return result;
};


Materi.getQuestionsByChapterKey = async (materiKey) => {
    const query = `
        SELECT q.id, q.pertanyaan, q.tipe_soal, q.jawaban_esai
        FROM questions q
        JOIN chapters c ON q.chapter_id = c.id
        WHERE c.materiKey = ?
    `;
    const [questions] = await db.execute(query, [materiKey]);

    for (const q of questions) {
        if (q.tipe_soal.startsWith('pilihan-ganda')) {
            const [options] = await db.execute(
                "SELECT opsi_jawaban, is_correct FROM question_options WHERE question_id = ?",
                [q.id]
            );
            q.options = options.map(opt => opt.opsi_jawaban);
            const correctOption = options.find(opt => opt.is_correct);
            q.correctAnswer = correctOption ? correctOption.opsi_jawaban : null;
        }
    }
    return questions;
};

Materi.findChaptersBySubjectName = async (jenjang, kelas, namaMapel) => {
    let query = `
        SELECT c.id, c.judul, c.materiKey 
        FROM chapters c
        JOIN subjects s ON c.subject_id = s.id
        WHERE s.jenjang = ? AND s.nama_mapel = ?
    `;
    const params = [jenjang, namaMapel];

    if (jenjang.toUpperCase() === 'SD') {
        query += " AND s.kelas = ?";
        params.push(kelas);
    } else {
        query += " AND s.kelas IS NULL";
    }

    const [rows] = await db.execute(query, params);
    return rows;
};


// === Operasi CREATE, DELETE, dan PENILAIAN (tidak berubah) ===
// ... (Salin sisa kode dari file Anda yang sudah ada di sini)
Materi.createChapter = async (judul, subjectId) => {
    const [subjects] = await db.execute("SELECT jenjang, kelas, nama_mapel FROM subjects WHERE id = ?", [subjectId]);
    if (subjects.length === 0) {
        throw new Error("Subject ID tidak ditemukan.");
    }
    const { jenjang, kelas, nama_mapel } = subjects[0];

    const materiKey = `${jenjang.toLowerCase()}-${kelas || 'tk'}-${nama_mapel.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const [result] = await db.execute(
        "INSERT INTO chapters (judul, materiKey, subject_id) VALUES (?, ?, ?)",
        [judul, materiKey, subjectId]
    );
    return { id: result.insertId, judul, materiKey };
};

Materi.createQuestion = async (materiKey, questionData) => {
    const [chapters] = await db.execute("SELECT id FROM chapters WHERE materiKey = ?", [materiKey]);
    if (chapters.length === 0) throw new Error("Chapter not found");
    const chapterId = chapters[0].id;

    const { type, question, options, correctAnswer, essayAnswer } = questionData;

    const [result] = await db.execute(
        "INSERT INTO questions (pertanyaan, tipe_soal, jawaban_esai, chapter_id) VALUES (?, ?, ?, ?)",
        [question, type, essayAnswer || null, chapterId]
    );
    const questionId = result.insertId;

    if (type.startsWith('pilihan-ganda') && options) {
        for (const opt of options) {
            await db.execute(
                "INSERT INTO question_options (opsi_jawaban, is_correct, question_id) VALUES (?, ?, ?)",
                [opt, opt === correctAnswer, questionId]
            );
        }
    }
    return { id: questionId, ...questionData };
};

Materi.deleteChapter = async (materiKey) => {
    const [result] = await db.execute("DELETE FROM chapters WHERE materiKey = ?", [materiKey]);
    return result.affectedRows;
};

Materi.deleteQuestion = async (questionId) => {
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
        "INSERT INTO student_submissions (user_id, chapter_id, score, is_graded_by_system, status) VALUES (?, ?, ?, ?, ?)",
        [userId, chapterId, score, isSystemGraded, status]
    );
    return result.insertId;
};

Materi.saveStudentAnswer = async (submissionId, questionId, answerText, isCorrect) => {
    await db.execute(
        "INSERT INTO student_answers (submission_id, question_id, answer_text, is_correct) VALUES (?, ?, ?, ?)",
        [submissionId, questionId, answerText, isCorrect]
    );
};

Materi.getSubmissionsForGrading = async (chapterId) => {
    const [rows] = await db.execute(`
        SELECT ss.id, u.nama as student_name, ss.submission_date 
        FROM student_submissions ss
        JOIN users u ON ss.user_id = u.id
        WHERE ss.chapter_id = ? AND ss.status = 'selesai' AND ss.is_graded_by_system = false
    `, [chapterId]);
    return rows;
};

Materi.getSubmissionDetails = async (submissionId) => {
    const [rows] = await db.execute(`
        SELECT q.pertanyaan, sa.answer_text, q.jawaban_esai as correct_essay_answer 
        FROM student_answers sa
        JOIN questions q ON sa.question_id = q.id
        WHERE sa.submission_id = ?
    `, [submissionId]);
    return rows;
};

Materi.gradeSubmissionManually = async (submissionId, score) => {
    const [result] = await db.execute(
        "UPDATE student_submissions SET score = ?, status = 'dinilai' WHERE id = ?",
        [score, submissionId]
    );
    return result.affectedRows;
};

// GANTI FUNGSI LAMA 'getSubmissionsForGrading' DENGAN FUNGSI BARU INI
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
    return rows;
};

module.exports = Materi;