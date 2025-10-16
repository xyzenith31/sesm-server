// contoh-sesm-server/models/bookmark.model.js
const db = require("../config/database.config.js");
const fs = require('fs');
const path = require('path');

const Bookmark = {};

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

Bookmark.create = async (data) => {
    const { title, description, type, url, subject, cover_image_url, creator_id, tasks, grading_type, recommended_level } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const tasksJson = JSON.stringify(tasks || []);
        const query = `
            INSERT INTO bookmarks (title, description, type, url, subject, cover_image_url, creator_id, tasks, grading_type, recommended_level) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await conn.execute(query, [title, description, type, url, subject, cover_image_url, creator_id, tasksJson, grading_type, recommended_level]);
        
        await conn.commit();
        return { id: result.insertId, ...data };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

Bookmark.findAllWithTasks = async () => {
    const query = `
        SELECT 
            b.*,
            u.nama as creator_name,
            u.avatar as creator_avatar
        FROM bookmarks b
        JOIN users u ON b.creator_id = u.id
        ORDER BY b.created_at DESC
    `;
    const [rows] = await db.execute(query);
    return rows.map(row => ({
        ...row,
        tasks: row.tasks ? JSON.parse(row.tasks) : []
    }));
};

Bookmark.updateById = async (bookmarkId, data) => {
    const { title, description, subject, tasks, grading_type, recommended_level } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const tasksJson = JSON.stringify(tasks || []);

        const query = `
            UPDATE bookmarks 
            SET title = ?, description = ?, subject = ?, tasks = ?, grading_type = ?, recommended_level = ?
            WHERE id = ?
        `;
        const [result] = await conn.execute(query, [title, description, subject, tasksJson, grading_type, recommended_level, bookmarkId]);
        
        await conn.commit();
        return result.affectedRows;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

Bookmark.deleteById = async (bookmarkId) => {
    const [rows] = await db.execute("SELECT url, cover_image_url, type FROM bookmarks WHERE id = ?", [bookmarkId]);
    if (rows.length > 0) {
        const bookmark = rows[0];
        if (bookmark.type !== 'video_link') {
            deleteFile(bookmark.url);
        }
        deleteFile(bookmark.cover_image_url);
    }
    const [result] = await db.execute("DELETE FROM bookmarks WHERE id = ?", [bookmarkId]);
    return result.affectedRows;
};

// --- FUNGSI UNTUK NILAI ---
Bookmark.createSubmission = async (userId, bookmarkId) => {
    const [result] = await db.execute(
        "INSERT INTO bookmark_submissions (user_id, bookmark_id) VALUES (?, ?)",
        [userId, bookmarkId]
    );
    return result.insertId;
};

Bookmark.saveStudentAnswer = async (submissionId, questionIndex, questionText, answerText, isCorrect) => {
    await db.execute(
        "INSERT INTO bookmark_answers (submission_id, question_index, question_text, answer_text, is_correct) VALUES (?, ?, ?, ?, ?)",
        [submissionId, questionIndex, questionText, answerText, isCorrect]
    );
};

Bookmark.getSubmissionsByBookmarkId = async (bookmarkId) => {
    const [rows] = await db.execute(`
        SELECT 
            bs.id, u.nama as student_name, bs.submission_date, bs.score, bs.status
        FROM bookmark_submissions bs
        JOIN users u ON bs.user_id = u.id
        WHERE bs.bookmark_id = ?
        ORDER BY bs.status ASC, bs.submission_date DESC
    `, [bookmarkId]);
    return rows;
};

Bookmark.getSubmissionDetails = async (submissionId) => {
    const [rows] = await db.execute(`
        SELECT id, question_index, question_text, answer_text, is_correct, correction_text
        FROM bookmark_answers WHERE submission_id = ? ORDER BY question_index ASC
    `, [submissionId]);
    return rows;
};

Bookmark.gradeSubmissionManually = async (submissionId, score, graderId) => {
    const [result] = await db.execute(
        "UPDATE bookmark_submissions SET score = ?, status = 'dinilai', grader_id = ? WHERE id = ?",
        [score, graderId, submissionId]
    );
    return result.affectedRows;
};

Bookmark.updateAnswerDetails = async (answerId, { is_correct, correction_text }) => {
    await db.execute("UPDATE bookmark_answers SET is_correct = ?, correction_text = ? WHERE id = ?", [is_correct, correction_text, answerId]);
};


Bookmark.findSubmissionsByUserId = async (userId) => {
    const query = `
        SELECT 
            bs.id, 
            b.title, 
            bs.score, 
            bs.status, 
            bs.submission_date as date,
            grader.nama as grader_name,
            grader.avatar as grader_avatar
        FROM bookmark_submissions bs 
        JOIN bookmarks b ON bs.bookmark_id = b.id
        LEFT JOIN users grader ON bs.grader_id = grader.id
        WHERE bs.user_id = ? 
        ORDER BY bs.submission_date DESC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
};

// Fungsi baru untuk mengambil detail pengerjaan siswa yang terverifikasi
Bookmark.findSubmissionDetailsForStudent = async (submissionId, userId) => {
    const [submissionOwner] = await db.execute("SELECT user_id FROM bookmark_submissions WHERE id = ?", [submissionId]);
    if (submissionOwner.length === 0 || submissionOwner[0].user_id !== userId) {
        throw new Error("Akses ditolak.");
    }

    const [rows] = await db.execute(`
        SELECT id, question_index, question_text, answer_text, is_correct, correction_text
        FROM bookmark_answers WHERE submission_id = ? ORDER BY question_index ASC
    `, [submissionId]);
    return rows;
};

// --- FUNGSI BARU UNTUK MENAMBAH SOAL DARI BANK SOAL MATERI ---
Bookmark.addQuestionsFromBank = async (bookmarkId, questionIds) => {
    if (!questionIds || questionIds.length === 0) {
        return 0;
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Dapatkan bookmark yang ada, terutama kolom 'tasks'
        const [bookmarks] = await conn.execute("SELECT tasks FROM bookmarks WHERE id = ?", [bookmarkId]);
        if (bookmarks.length === 0) {
            throw new Error(`Bookmark dengan ID '${bookmarkId}' tidak ditemukan.`);
        }
        
        let existingTasks = [];
        try {
            existingTasks = JSON.parse(bookmarks[0].tasks) || [];
        } catch (e) {
            existingTasks = [];
        }

        const newTasks = [];
        for (const questionId of questionIds) {
            // 2. Ambil data soal asli dari tabel 'questions'
            const [originalQuestions] = await conn.execute("SELECT * FROM questions WHERE id = ?", [questionId]);
            if (originalQuestions.length === 0) {
                console.warn(`Soal dengan ID ${questionId} tidak ditemukan, dilewati.`);
                continue;
            }
            const originalQ = originalQuestions[0];

            // 3. Format soal ke dalam format 'task'
            const newTask = {
                id: Date.now() + Math.random(),
                type: originalQ.tipe_soal,
                question: originalQ.pertanyaan,
                essayAnswer: originalQ.jawaban_esai || '',
                options: [],
                correctAnswer: ''
            };

            // 4. Jika soal adalah pilihan ganda, ambil juga opsinya
            if (originalQ.tipe_soal.includes('pilihan-ganda')) {
                const [originalOptions] = await conn.execute("SELECT * FROM question_options WHERE question_id = ?", [questionId]);
                newTask.options = originalOptions.map(opt => opt.opsi_jawaban);
                const correctOpt = originalOptions.find(opt => opt.is_correct);
                if (correctOpt) {
                    newTask.correctAnswer = correctOpt.opsi_jawaban;
                }
            }
            newTasks.push(newTask);
        }

        // 5. Gabungkan task lama dan baru, lalu update bookmark
        const allTasks = [...existingTasks, ...newTasks];
        await conn.execute(
            "UPDATE bookmarks SET tasks = ? WHERE id = ?",
            [JSON.stringify(allTasks), bookmarkId]
        );
        
        await conn.commit();
        return newTasks.length; // Mengembalikan jumlah soal yang berhasil ditambahkan

    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};


module.exports = Bookmark;