// contoh-sesm-server/models/bookmark.model.js
const db = require("../config/database.config.js");
const fs = require('fs');
const path = require('path');

const Bookmark = {};

// Helper function to delete files
const deleteFile = (url) => {
    if (!url) return;
    try {
        // Construct the absolute path from the project root
        const filePath = path.join(__dirname, '..', url); // Assumes 'uploads' is relative to the project root
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[File Delete] Successfully deleted: ${filePath}`);
        } else {
            console.log(`[File Delete] File not found, skipped: ${filePath}`);
        }
    } catch (err) {
        console.error(`[File Delete] Error deleting file: ${url}`, err);
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

// --- MODIFIED FUNCTION ---
Bookmark.updateById = async (bookmarkId, data) => {
    // Destructure all possible fields from data, including new file-related ones
    const { title, description, subject, tasks, grading_type, recommended_level, url, type, cover_image_url } = data;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Fetch the old bookmark data to get old file paths for deletion
        const [oldBookmarks] = await conn.execute("SELECT url, cover_image_url, type as old_type FROM bookmarks WHERE id = ?", [bookmarkId]); // Alias old type
        if (oldBookmarks.length === 0) {
            await conn.rollback(); // Rollback if not found
            return 0; // Indicate not found
        }
        const oldBookmark = oldBookmarks[0];

        // 2. Prepare fields and values for the SQL UPDATE query
        const fieldsToUpdate = {};
        if (title !== undefined) fieldsToUpdate.title = title;
        if (description !== undefined) fieldsToUpdate.description = description;
        if (subject !== undefined) fieldsToUpdate.subject = subject;
        if (grading_type !== undefined) fieldsToUpdate.grading_type = grading_type;
        if (recommended_level !== undefined) fieldsToUpdate.recommended_level = recommended_level;

        // Handle tasks (ensure it's stringified)
        if (tasks !== undefined) {
             try {
                // Ensure tasks is an array before stringifying, parse if string
                const tasksArray = typeof tasks === 'string' ? JSON.parse(tasks) : (Array.isArray(tasks) ? tasks : []);
                fieldsToUpdate.tasks = JSON.stringify(tasksArray);
            } catch (e) {
                console.warn(`[WARN] Invalid tasks format during update for bookmark ${bookmarkId}, skipping tasks update.`);
                // Optionally throw an error or handle invalid format
            }
        }


        // Handle main file/URL update
        // Check if 'url' is explicitly provided in the update data 'data'
        if ('url' in data) {
            // Delete the old main file ONLY if the old URL exists AND it wasn't a video link
            if (oldBookmark.url && oldBookmark.old_type !== 'video_link') {
                 console.log(`[File Delete] Deleting old main file due to update: ${oldBookmark.url}`);
                 deleteFile(oldBookmark.url);
            }
            fieldsToUpdate.url = url; // Update with the new URL (could be file path or link)
            if (type !== undefined) { // Update type if provided
                fieldsToUpdate.type = type;
            } else { // Infer type if not provided based on whether url is a link
                 fieldsToUpdate.type = (url && url.startsWith('http')) ? 'video_link' : 'file'; // Basic inference, adjust if needed
            }
        } else if (type !== undefined && type !== oldBookmark.old_type && type === 'video_link' && oldBookmark.url && oldBookmark.old_type !== 'video_link') {
             // Handle case where ONLY type changes to video_link (delete old file)
             console.log(`[File Delete] Deleting old main file because type changed to video_link: ${oldBookmark.url}`);
             deleteFile(oldBookmark.url);
             fieldsToUpdate.type = type;
             fieldsToUpdate.url = ''; // Clear the URL if changing type to link without providing a new link explicitly
        } else if (type !== undefined) {
            // Update type if only type is provided (and not changing to video_link from file)
            fieldsToUpdate.type = type;
        }


        // Handle cover image update
        // Check if 'cover_image_url' is explicitly provided in the update data 'data'
        if ('cover_image_url' in data) {
            // Delete the old cover image if it exists
            if (oldBookmark.cover_image_url) {
                console.log(`[File Delete] Deleting old cover image due to update: ${oldBookmark.cover_image_url}`);
                deleteFile(oldBookmark.cover_image_url);
            }
            fieldsToUpdate.cover_image_url = cover_image_url; // Can be the new path or null
        }

        // Check if there's anything to update
        if (Object.keys(fieldsToUpdate).length === 0) {
            await conn.commit(); // No changes, but commit transaction (e.g., if only files were uploaded but no DB fields changed)
            console.log(`[INFO] No database fields to update for bookmark ${bookmarkId}.`);
            return 0; // Indicate no DB rows affected, though files might have changed
        }

        // 3. Construct the dynamic SQL query
        const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(fieldsToUpdate), bookmarkId];
        const query = `UPDATE bookmarks SET ${setClauses} WHERE id = ?`;

        console.log(`[SQL Update] Query: ${query}`);
        console.log(`[SQL Update] Values:`, values);


        // 4. Execute the update
        const [result] = await conn.execute(query, values);

        await conn.commit();
        return result.affectedRows;

    } catch (error) {
        await conn.rollback();
        console.error(`[FATAL] Error updating bookmark ${bookmarkId}:`, error);
        throw error; // Re-throw the error
    } finally {
        conn.release();
    }
};
// --- END OF MODIFIED FUNCTION ---


Bookmark.deleteById = async (bookmarkId) => {
    const [rows] = await db.execute("SELECT url, cover_image_url, type FROM bookmarks WHERE id = ?", [bookmarkId]);
    if (rows.length > 0) {
        const bookmark = rows[0];
        // Only delete the main 'url' if it's not just a link
        if (bookmark.type !== 'video_link') {
            deleteFile(bookmark.url);
        }
        // Always try to delete the cover image if it exists
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
            bs.id, u.nama as student_name, bs.submission_date, bs.score, bs.status, bs.bookmark_id
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
    const finalIsCorrect = (is_correct === true || is_correct === false) ? is_correct : null;
    await db.execute("UPDATE bookmark_answers SET is_correct = ?, correction_text = ? WHERE id = ?", [finalIsCorrect, correction_text, answerId]);
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

Bookmark.addQuestionsFromBank = async (bookmarkId, questionIds) => {
    if (!questionIds || questionIds.length === 0) {
        return 0;
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

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
            const [originalQuestions] = await conn.execute("SELECT * FROM questions WHERE id = ?", [questionId]);
            if (originalQuestions.length === 0) {
                console.warn(`Soal dengan ID ${questionId} tidak ditemukan, dilewati.`);
                continue;
            }
            const originalQ = originalQuestions[0];

            const newTask = {
                id: Date.now() + Math.random(),
                type: originalQ.tipe_soal,
                question: originalQ.pertanyaan,
                essayAnswer: originalQ.jawaban_esai || '',
                options: [],
                correctAnswer: ''
            };

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

        const allTasks = [...existingTasks, ...newTasks];
        await conn.execute(
            "UPDATE bookmarks SET tasks = ? WHERE id = ?",
            [JSON.stringify(allTasks), bookmarkId]
        );

        await conn.commit();
        return newTasks.length;

    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

module.exports = Bookmark;