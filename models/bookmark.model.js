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
    const { title, description, type, url, subject, cover_image_url, creator_id, tasks, grading_type } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const tasksJson = JSON.stringify(tasks || []);
        const query = `
            INSERT INTO bookmarks (title, description, type, url, subject, cover_image_url, creator_id, tasks, grading_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await conn.execute(query, [title, description, type, url, subject, cover_image_url, creator_id, tasksJson, grading_type]);
        
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
            u.nama as creator_name
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
    const { title, description, subject, tasks, grading_type } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const tasksJson = JSON.stringify(tasks || []);

        const query = `
            UPDATE bookmarks 
            SET title = ?, description = ?, subject = ?, tasks = ?, grading_type = ?
            WHERE id = ?
        `;
        const [result] = await conn.execute(query, [title, description, subject, tasksJson, grading_type, bookmarkId]);
        
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

// --- FUNGSI BARU UNTUK NILAI ---
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
        SELECT id, question_index, question_text, answer_text, is_correct
        FROM bookmark_answers WHERE submission_id = ? ORDER BY question_index ASC
    `, [submissionId]);
    return rows;
};

Bookmark.gradeSubmissionManually = async (submissionId, score) => {
    const [result] = await db.execute(
        "UPDATE bookmark_submissions SET score = ?, status = 'dinilai' WHERE id = ?",
        [score, submissionId]
    );
    return result.affectedRows;
};

Bookmark.overrideAnswerCorrectness = async (answerId, isCorrect) => {
    await db.execute("UPDATE bookmark_answers SET is_correct = ? WHERE id = ?", [isCorrect, answerId]);
};

Bookmark.findSubmissionsByUserId = async (userId) => {
    const query = `
        SELECT bs.id, b.title, bs.score, bs.status, bs.submission_date as date
        FROM bookmark_submissions bs JOIN bookmarks b ON bs.bookmark_id = b.id
        WHERE bs.user_id = ? ORDER BY bs.submission_date DESC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
};

module.exports = Bookmark;
