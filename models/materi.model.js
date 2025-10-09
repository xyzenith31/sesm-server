// contoh-server-sesm/models/materi.model.js

const db = require("../config/database.config.js");

const Materi = {};

// === Operasi READ ===

Materi.getAdminDashboardData = async (jenjang, kelas) => {
    let query = `
        SELECT 
            s.id as subject_id,
            s.nama_mapel, 
            c.id as chapter_id, 
            c.judul as chapter_judul,
            c.materiKey,
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

    // --- PERBAIKAN UTAMA DI SINI ---
    // Logika pemrosesan data diubah untuk memastikan subject_id selalu ada.
    const result = {};
    rows.forEach(row => {
        if (!row.nama_mapel) return;

        // Jika mapel belum ada di hasil, inisialisasi dengan struktur baru
        if (!result[row.nama_mapel]) {
            result[row.nama_mapel] = {
                subject_id: row.subject_id, // Simpan ID di tingkat atas
                chapters: []
            };
        }
        
        // Jika ada data bab (bukan hasil NULL dari LEFT JOIN), tambahkan ke array chapters
        if (row.chapter_id) {
            result[row.nama_mapel].chapters.push({
                judul: row.chapter_judul,
                materiKey: row.materiKey,
                // subject_id tidak perlu lagi di sini karena sudah ada di level atas
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


// === Operasi CREATE ===
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

// === Operasi DELETE ===
Materi.deleteChapter = async (materiKey) => {
    const [result] = await db.execute("DELETE FROM chapters WHERE materiKey = ?", [materiKey]);
    return result.affectedRows;
};

Materi.deleteQuestion = async (questionId) => {
    const [result] = await db.execute("DELETE FROM questions WHERE id = ?", [questionId]);
    return result.affectedRows;
};

module.exports = Materi;