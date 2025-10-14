// contoh-server-sesm/controllers/quiz.controller.js
const Quiz = require("../models/quiz.model.js");
const Point = require("../models/point.model.js"); // Impor model Point

// === FUNGSI PENGATURAN KUIS (DIPERBAIKI DENGAN LOGGING) ===
exports.updateQuizSettings = async (req, res) => {
    const quizId = parseInt(req.params.quizId, 10);
    const settings = req.body;

    // --- LOGGING UNTUK DEBUGGING ---
    console.log(`[INFO] Request to update settings for quizId: ${req.params.quizId}`);
    console.log(`[DATA] Received settings payload:`, settings);

    if (isNaN(quizId)) {
        console.error(`[ERROR] Invalid quizId received: ${req.params.quizId}`);
        return res.status(400).send({ message: "ID Kuis tidak valid." });
    }

    try {
        const result = await Quiz.updateSettings(quizId, settings);
        if (result.affectedRows === 0) {
            console.warn(`[WARN] Quiz with ID ${quizId} not found for settings update.`);
            return res.status(404).send({ message: `Kuis dengan ID ${quizId} tidak ditemukan.` });
        }
        console.log(`[SUCCESS] Settings for quizId: ${quizId} updated successfully.`);
        res.status(200).send({ message: "Pengaturan kuis berhasil diperbarui." });
    } catch (error) {
        console.error(`[FATAL] Error updating settings for quizId: ${quizId}`, error);
        res.status(500).send({ 
            message: "Terjadi kesalahan internal pada server.",
            error: error.message
        });
    }
};


// === FUNGSI EDIT SOAL ===
exports.updateQuestion = async (req, res) => {
    const { questionId } = req.params;
    const { question_text, question_type, options, existingMedia, links, essayAnswer } = req.body;

    if (!question_text || !question_type) {
        return res.status(400).send({ message: "Teks pertanyaan dan tipe soal wajib diisi." });
    }

    try {
        const media_attachments = [];
        if (req.files) {
            req.files.forEach(file => {
                media_attachments.push({ type: 'file', url: file.path.replace(/\\/g, "/") });
            });
        }
        if (existingMedia) {
             const parsedExistingMedia = JSON.parse(existingMedia);
             media_attachments.push(...parsedExistingMedia);
        }
        if (links) {
            JSON.parse(links).forEach(link => {
                media_attachments.push({ type: 'link', url: link });
            });
        }

        let parsedOptions;
        if (question_type.includes('pilihan-ganda')) {
            parsedOptions = JSON.parse(options);
            if (!parsedOptions || !parsedOptions.some(o => o.isCorrect)) {
                return res.status(400).send({ message: "Harus ada setidaknya satu jawaban benar untuk pilihan ganda." });
            }
        }
        
        const questionData = {
            question_text,
            question_type,
            options: parsedOptions,
            essayAnswer: essayAnswer || null,
            media_attachments: media_attachments,
        };

        const updatedQuestion = await Quiz.updateQuestion(questionId, questionData);
        res.status(200).send({ message: "Soal berhasil diperbarui.", data: updatedQuestion });

    } catch (error) {
        console.error("Update Question Error:", error);
        res.status(500).send({ message: "Terjadi kesalahan saat memperbarui soal." });
    }
};


// === FUNGSI TAMBAH SOAL ===
exports.addQuestionToQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { question_text, question_type, options, links, essayAnswer } = req.body;

    if (!question_text || !question_type) {
        return res.status(400).send({ message: "Teks pertanyaan dan tipe soal wajib diisi." });
    }
    
    try {
        const media_attachments = [];

        if (req.files) { 
            req.files.forEach(file => { 
                media_attachments.push({ type: 'file', url: file.path.replace(/\\/g, "/") }); 
            }); 
        }
        if (links) { 
            JSON.parse(links).forEach(link => { 
                media_attachments.push({ type: 'link', url: link }); 
            }); 
        }

        let parsedOptions;
        if (question_type.includes('pilihan-ganda')) {
            parsedOptions = JSON.parse(options);
            if (!parsedOptions || parsedOptions.length < 2 || !parsedOptions.some(o => o.isCorrect)) {
                return res.status(400).send({ message: "Pilihan ganda harus memiliki minimal 2 opsi dan satu jawaban benar." });
            }
        }
        
        const questionData = { 
            question_text, 
            question_type, 
            options: parsedOptions, 
            essayAnswer: essayAnswer || null,
            media_attachments: media_attachments,
        };

        const newQuestion = await Quiz.addQuestion(quizId, questionData);
        res.status(201).send({ message: "Soal berhasil ditambahkan.", data: newQuestion });
    } catch (error) {
        console.error("Add Question Error:", error);
        res.status(500).send({ message: "Terjadi kesalahan internal saat menambah soal." });
    }
};


// === FUNGSI SUBMIT KUIS DENGAN PENAMBAHAN POIN ===
exports.submitQuiz = async (req, res) => {
    const userId = req.userId;
    const { quizId } = req.params;
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) return res.status(400).send({ message: "Format jawaban tidak valid." });
    try {
        // 1. Proses submit kuis seperti biasa
        const result = await Quiz.submit(userId, quizId, answers);

        // 2. Tambahkan poin setelah kuis berhasil disubmit
        const pointsToAdd = 250; // Anda bisa membuat ini dinamis nanti
        const quizInfo = await Quiz.findById(quizId); // Ambil info kuis
        
        await Point.addPoints(
            userId, 
            pointsToAdd, 
            'QUIZ_COMPLETION', 
            `Menyelesaikan kuis: ${quizInfo ? quizInfo.title : `ID ${quizId}`}`
        );

        // 3. Kirim response ke user
        res.status(200).send({ 
            message: `Kuis berhasil dikumpulkan dan Anda mendapatkan ${pointsToAdd} poin!`, 
            ...result 
        });

    } catch (error) { 
        res.status(500).send({ message: "Gagal memproses jawaban: " + error.message }); 
    }
};

// --- Sisa file tetap sama (tidak perlu diubah) ---
exports.createQuiz = async (req, res) => {
    try {
        const { title, description, recommended_level } = req.body;
        const creatorId = req.userId;
        if (!title) return res.status(400).send({ message: "Judul kuis tidak boleh kosong." });
        const coverImageUrl = req.file ? req.file.path.replace(/\\/g, "/") : null;
        const newQuiz = await Quiz.create(title, description, creatorId, coverImageUrl, recommended_level);
        res.status(201).send({ message: "Kuis berhasil dibuat!", data: newQuiz });
    } catch (error) {
        console.error("ERROR SAAT CREATE QUIZ:", error);
        res.status(500).send({ message: "Terjadi kesalahan internal saat membuat kuis." });
    }
};

exports.addQuestionsFromBank = async (req, res) => {
    const { quizId } = req.params;
    const { questionIds } = req.body;
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) return res.status(400).send({ message: "Daftar ID soal tidak valid." });
    try {
        const questionsAdded = await Quiz.addQuestionsFromBank(quizId, questionIds);
        res.status(201).send({ message: `${questionsAdded} soal berhasil ditambahkan dari bank.` });
    } catch (error) {
        console.error("Add from Bank Error:", error);
        res.status(500).send({ message: "Terjadi kesalahan saat menambah soal dari bank." });
    }
};

exports.deleteQuiz = async (req, res) => {
    try {
        const affectedRows = await Quiz.delete(req.params.quizId);
        if (affectedRows === 0) return res.status(404).send({ message: "Kuis tidak ditemukan." });
        res.status(200).send({ message: "Kuis berhasil dihapus." });
    } catch (error) { res.status(500).send({ message: error.message }); }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const affectedRows = await Quiz.deleteQuestion(req.params.questionId);
        if (affectedRows === 0) return res.status(404).send({ message: "Soal tidak ditemukan." });
        res.status(200).send({ message: "Soal berhasil dihapus." });
    } catch (error) { res.status(500).send({ message: error.message }); }
};

exports.getQuizDetailsForAdmin = async (req, res) => {
    try {
        const questions = await Quiz.getQuestionsForAdmin(req.params.quizId);
        res.status(200).json(questions);
    } catch (error) { res.status(500).send({ message: error.message }); }
};

exports.listAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.getAll();
        res.status(200).json(quizzes);
    } catch (error) { res.status(500).send({ message: error.message }); }
};

exports.getQuizForStudent = async (req, res) => {
    try {
        const questions = await Quiz.getQuestionsForQuiz(req.params.quizId);
        res.status(200).json(questions);
    } catch (error) { res.status(500).send({ message: error.message }); }
};

exports.getSubmissionsForQuiz = async (req, res) => {
    try {
        const submissions = await Quiz.getSubmissionsByQuizId(req.params.quizId);
        res.status(200).json(submissions);
    } catch (error) {
        console.error("Error in getSubmissionsForQuiz controller:", error);
        res.status(500).send({ message: "Gagal mengambil data submission kuis: " + error.message });
    }
};