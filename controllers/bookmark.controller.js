// contoh-sesm-server/controllers/bookmark.controller.js
const Bookmark = require("../models/bookmark.model.js");
const db = require("../config/database.config.js"); // Impor db untuk query langsung

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

exports.createBookmark = async (req, res) => {
    const { title, description, subject, url_link, tasks, grading_type } = req.body;
    const creator_id = req.userId;
    if (!title) return res.status(400).send({ message: "Judul wajib diisi." });
    try {
        const mainFile = req.files?.mainFile?.[0];
        const coverImage = req.files?.coverImage?.[0];
        const bookmarkData = {
            title, description, subject,
            type: determineType(mainFile, url_link),
            url: url_link || (mainFile ? mainFile.path.replace(/\\/g, "/") : null),
            cover_image_url: coverImage ? coverImage.path.replace(/\\/g, "/") : null,
            creator_id,
            tasks: tasks ? JSON.parse(tasks) : [],
            grading_type: grading_type || 'manual'
        };
        const newBookmark = await Bookmark.create(bookmarkData);
        res.status(201).send({ message: "Materi berhasil ditambahkan.", data: newBookmark });
    } catch (error) { res.status(500).send({ message: "Gagal menyimpan." }); }
};

exports.updateBookmark = async (req, res) => {
    const { bookmarkId } = req.params;
    const { title, description, subject, tasks, grading_type } = req.body;
    if (!title || !subject) return res.status(400).send({ message: "Judul dan subjek wajib diisi." });
    try {
        const dataToUpdate = { title, description, subject, tasks: tasks ? JSON.parse(tasks) : [], grading_type };
        const affectedRows = await Bookmark.updateById(bookmarkId, dataToUpdate);
        if (affectedRows === 0) return res.status(404).send({ message: "Materi tidak ditemukan." });
        res.status(200).send({ message: "Materi berhasil diperbarui." });
    } catch (error) { res.status(500).send({ message: "Gagal memperbarui." }); }
};

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

// --- CONTROLLER BARU UNTUK NILAI ---
exports.submitAnswers = async (req, res) => {
    const userId = req.userId;
    const { bookmarkId } = req.params;
    const { answers } = req.body;
    try {
        const [bookmarks] = await db.execute("SELECT tasks, grading_type FROM bookmarks WHERE id = ?", [bookmarkId]);
        if (!bookmarks.length) return res.status(404).send({ message: "Bookmark tidak ditemukan." });
        
        const { tasks, grading_type } = bookmarks[0];
        const questions = JSON.parse(tasks || '[]');
        
        let score = null;
        let correctCount = 0;
        const submissionId = await Bookmark.createSubmission(userId, bookmarkId);

        for (let i = 0; i < questions.length; i++) {
            const questionText = questions[i];
            const answerText = answers[i] || '';
            let isCorrect = null; // Default NULL
            // Penilaian otomatis hanya untuk soal yang ada kunci jawabannya (format: "Pertanyaan@@KunciJawaban")
            if (grading_type === 'otomatis' && questionText.includes('@@')) {
                const [q, key] = questionText.split('@@');
                isCorrect = answerText.trim().toLowerCase() === key.trim().toLowerCase();
                if(isCorrect) correctCount++;
            }
            await Bookmark.saveStudentAnswer(submissionId, i, questionText.split('@@')[0], answerText, isCorrect);
        }

        if (grading_type === 'otomatis') {
            score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 100;
            await Bookmark.gradeSubmissionManually(submissionId, score);
            res.status(201).send({ message: "Jawaban berhasil dikumpulkan!", score });
        } else {
            res.status(201).send({ message: "Jawaban berhasil dikumpulkan dan akan segera dinilai oleh guru." });
        }
    } catch (error) { res.status(500).send({ message: "Gagal menyimpan jawaban." }); }
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
