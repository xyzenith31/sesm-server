// contoh-sesm-server/controllers/bookmark.controller.js
const Bookmark = require("../models/bookmark.model.js");
const db = require("../config/database.config.js");
const Point = require("../models/point.model.js");
const fs = require('fs');
const path = require('path');

const determineType = (file, link) => {
    if (link) return 'video_link';
    if (file) {
        const mime = file.mimetype;
        if (mime.startsWith('image/')) return 'image';
        if (mime.startsWith('video/')) return 'video';
        if (mime === 'application/pdf') return 'pdf';
        if (mime.includes('word')) return 'document';
        return 'file';
    }
    return 'unknown';
};

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

exports.createBookmark = async (req, res) => {
    const { title, description, subject, url_link, tasks, grading_type, recommended_level } = req.body;
    const creator_id = req.userId;
    if (!title) return res.status(400).send({ message: "Judul wajib diisi." });

    try {
        const mainFile = req.files?.mainFile?.[0];
        const coverImage = req.files?.coverImage?.[0];

        let parsedTasks = [];
        if (typeof tasks === 'string') {
            try { parsedTasks = JSON.parse(tasks); } catch (e) { return res.status(400).send({ message: "Format data tugas tidak valid." });}
        } else if (Array.isArray(tasks)) {
            parsedTasks = tasks;
        }

        const bookmarkData = {
            title, description, subject,
            type: determineType(mainFile, url_link),
            url: url_link || (mainFile ? mainFile.path.replace(/\\/g, "/") : ''),
            cover_image_url: coverImage ? coverImage.path.replace(/\\/g, "/") : null,
            creator_id,
            tasks: parsedTasks,
            grading_type: grading_type || 'manual',
            recommended_level: recommended_level || 'Semua'
        };
        const newBookmark = await Bookmark.create(bookmarkData);
        res.status(201).send({ message: "Materi berhasil ditambahkan.", data: newBookmark });
    } catch (error) {
        console.error("CREATE BOOKMARK ERROR:", error);
        res.status(500).send({ message: "Gagal menyimpan materi di server." });
    }
};

// --- PERUBAHAN DI SINI: Logika update file ditambahkan ---
exports.updateBookmark = async (req, res) => {
    const { bookmarkId } = req.params;
    const { title, description, subject, tasks, grading_type, recommended_level, url_link } = req.body;
    
    if (!title || !subject) return res.status(400).send({ message: "Judul dan subjek wajib diisi." });

    try {
        const [oldBookmarks] = await db.execute("SELECT url, cover_image_url, type FROM bookmarks WHERE id = ?", [bookmarkId]);
        if (oldBookmarks.length === 0) {
            return res.status(404).send({ message: "Materi tidak ditemukan." });
        }
        const oldBookmark = oldBookmarks[0];

        const dataToUpdate = { title, description, subject, grading_type, recommended_level };
        
        const mainFile = req.files?.mainFile?.[0];
        const coverImage = req.files?.coverImage?.[0];
        
        if (mainFile) {
            if (oldBookmark.type !== 'video_link') deleteFile(oldBookmark.url);
            dataToUpdate.url = mainFile.path.replace(/\\/g, "/");
            dataToUpdate.type = determineType(mainFile, null);
        } else if (url_link) {
            if (oldBookmark.type !== 'video_link') deleteFile(oldBookmark.url);
            dataToUpdate.url = url_link;
            dataToUpdate.type = 'video_link';
        }

        if (coverImage) {
            deleteFile(oldBookmark.cover_image_url);
            dataToUpdate.cover_image_url = coverImage.path.replace(/\\/g, "/");
        }

        let parsedTasks = [];
        if (typeof tasks === 'string') {
            try { parsedTasks = JSON.parse(tasks); } catch (e) { return res.status(400).send({ message: "Format data tugas tidak valid." });}
        } else if (Array.isArray(tasks)) {
            parsedTasks = tasks;
        }
        dataToUpdate.tasks = parsedTasks;
        
        const affectedRows = await Bookmark.updateById(bookmarkId, dataToUpdate);
        if (affectedRows === 0) return res.status(404).send({ message: "Materi tidak ditemukan saat proses update." });

        res.status(200).send({ message: "Materi berhasil diperbarui." });
    } catch (error) {
        console.error("UPDATE BOOKMARK ERROR:", error);
        res.status(500).send({ message: "Gagal memperbarui materi di server." });
    }
};

// ... (Sisa controller tidak berubah)
exports.getAllBookmarks = async (req, res) => {
    try {
        const bookmarks = await Bookmark.findAllWithTasks();
        res.status(200).json(bookmarks);
    } catch (error) { res.status(500).send({ message: "Gagal mengambil data." }); }
};

exports.deleteBookmark = async (req, res) => {
    const { bookmarkId } = req.params;
    try {
        const affectedRows = await Bookmark.deleteById(bookmarkId);
        if (affectedRows === 0) return res.status(404).send({ message: "Materi tidak ditemukan." });
        res.status(200).send({ message: "Materi berhasil dihapus." });
    } catch (error) { res.status(500).send({ message: "Gagal menghapus." }); }
};

exports.submitAnswers = async (req, res) => {
    const userId = req.userId;
    const { bookmarkId } = req.params;
    const { answers } = req.body;
    try {
        const [bookmarks] = await db.execute("SELECT title, tasks, grading_type FROM bookmarks WHERE id = ?", [bookmarkId]);
        if (!bookmarks.length) return res.status(404).send({ message: "Bookmark tidak ditemukan." });
        
        const { title, tasks, grading_type } = bookmarks[0];
        const questions = JSON.parse(tasks || '[]');
        
        let score = null;
        let correctCount = 0;
        const submissionId = await Bookmark.createSubmission(userId, bookmarkId);

        for (let i = 0; i < questions.length; i++) {
            const questionObj = questions[i];
            const questionText = questionObj.question;
            const answerText = answers[i] || '';
            let isCorrect = null;
            if (grading_type === 'otomatis') {
                if (questionObj.type.includes('pilihan-ganda')) {
                    isCorrect = answerText.trim().toLowerCase() === (questionObj.correctAnswer || '').trim().toLowerCase();
                } else {
                    isCorrect = false; // Esai perlu dinilai manual
                }
                if(isCorrect) correctCount++;
            }
            await Bookmark.saveStudentAnswer(submissionId, i, questionText, answerText, isCorrect);
        }

        const pointsAwarded = 600;
        await Point.addPoints(
            userId,
            pointsAwarded,
            'BOOKMARK_COMPLETION',
            `Menyelesaikan materi bookmark: ${title}`
        );

        let responsePayload = {
            message: `Jawaban berhasil dikumpulkan dan Anda mendapatkan ${pointsAwarded} poin!`,
            pointsAwarded
        };

        if (grading_type === 'otomatis') {
            const mcqCount = questions.filter(q => q.type.includes('pilihan-ganda')).length;
            score = mcqCount > 0 ? Math.round((correctCount / mcqCount) * 100) : 100;
            await Bookmark.gradeSubmissionManually(submissionId, score);
            responsePayload.score = score;
        }

        res.status(201).send(responsePayload);

    } catch (error) { 
        console.error("Submit Bookmark Error:", error);
        res.status(500).send({ message: "Gagal menyimpan jawaban." }); 
    }
};

exports.getSubmissions = async (req, res) => {
    try { res.status(200).json(await Bookmark.getSubmissionsByBookmarkId(req.params.bookmarkId)); }
    catch (error) { res.status(500).send({ message: "Gagal mengambil data pengerjaan." }); }
};

exports.getSubmissionDetails = async (req, res) => {
    try { res.status(200).json(await Bookmark.getSubmissionDetails(req.params.submissionId)); }
    catch (error) { res.status(500).send({ message: "Gagal mengambil detail jawaban." }); }
};

exports.gradeSubmission = async (req, res) => {
    const { submissionId } = req.params;
    const { score, answers } = req.body;
    try {
        for (const ans of answers) {
            await Bookmark.overrideAnswerCorrectness(ans.id, ans.is_correct);
        }
        await Bookmark.gradeSubmissionManually(submissionId, score);
        res.status(200).send({ message: "Nilai berhasil disimpan." });
    } catch (error) { res.status(500).send({ message: "Gagal menyimpan nilai." }); }
};

exports.getMySubmissions = async (req, res) => {
    try { res.status(200).json(await Bookmark.findSubmissionsByUserId(req.userId)); }
    catch (error) { res.status(500).send({ message: "Gagal mengambil riwayat pengerjaan." }); }
};