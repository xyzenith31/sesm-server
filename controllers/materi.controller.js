// contoh-server-sesm/controllers/materi.controller.js
const Materi = require("../models/materi.model.js");

// === UNTUK GURU / ADMIN ===

// --- FUNGSI BARU UNTUK BANK SOAL ---
exports.getAllQuestionsForBank = async (req, res) => {
    // Ambil jenjang & kelas dari user yang login, bukan dari query params
    // Middleware authJwt harus sudah menambahkan req.user
    // Untuk sementara, kita asumsikan guru hanya bisa akses jenjangnya sendiri
    // Kita akan butuh data ini dari token atau session di masa depan
    const { jenjang, kelas } = req.query; // Sementara pakai query

    if (!jenjang) {
        return res.status(400).send({ message: "Query 'jenjang' dibutuhkan." });
    }
    // Kelas tidak wajib, karena TK tidak punya kelas
    
    try {
        const data = await Materi.getAllQuestionsForBank(jenjang, kelas);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getMateriForAdmin = async (req, res) => {
    const { jenjang, kelas } = req.query;
    if (!jenjang) {
        return res.status(400).send({ message: "Query 'jenjang' dibutuhkan." });
    }
    if (jenjang.toUpperCase() === 'SD' && !kelas) {
        return res.status(400).send({ message: "Query 'kelas' dibutuhkan untuk jenjang SD." });
    }

    try {
        const data = await Materi.getAdminDashboardData(jenjang, kelas);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getDetailMateriForAdmin = async (req, res) => {
    const { materiKey } = req.params;
    try {
        // Ambil judul chapter
        const chapter = await Materi.findChapterByMateriKey(materiKey);
        // Ambil soal-soal
        const questions = await Materi.getQuestionsByChapterKey(materiKey);
        // Gabungkan
        res.status(200).json({ 
            judul: chapter ? chapter.judul : "Tidak Ditemukan",
            questions 
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.addChapter = async (req, res) => {
    const { judul, subjectId } = req.body;
    if (!judul || !subjectId) {
        return res.status(400).send({ message: "Data 'judul' dan 'subjectId' dibutuhkan." });
    }
    try {
        const newChapter = await Materi.createChapter(judul, subjectId);
        res.status(201).json(newChapter);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.addQuestion = async (req, res) => {
    const { materiKey } = req.params;
    try {
        const mediaFiles = req.files;
        const media_urls = mediaFiles ? mediaFiles.map(file => file.path.replace(/\\/g, "/")) : [];
        const questionData = {
            ...req.body,
            options: req.body.options ? JSON.parse(req.body.options) : [],
            media_urls: media_urls
        };
        const newQuestion = await Materi.createQuestion(materiKey, questionData);
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error("Add Question Error:", error);
        res.status(500).send({ message: error.message });
    }
};

exports.deleteChapter = async (req, res) => {
    const { materiKey } = req.params;
    try {
        const affectedRows = await Materi.deleteChapter(materiKey);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Bab tidak ditemukan." });
        }
        res.status(200).send({ message: "Bab berhasil dihapus." });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    const { questionId } = req.params;
    try {
        const affectedRows = await Materi.deleteQuestion(questionId);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Soal tidak ditemukan." });
        }
        res.status(200).send({ message: "Soal dan file terkait berhasil dihapus." });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// === UNTUK SISWA ===
exports.getChaptersBySubjectName = async (req, res) => {
    const { jenjang, kelas, namaMapel } = req.params;
    try {
        const chapters = await Materi.findChaptersBySubjectName(jenjang, kelas, namaMapel);
        res.status(200).json(chapters);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getMateriSiswa = async (req, res) => {
    const { materiKey } = req.params;
    try {
        const questionsWithAnswers = await Materi.getQuestionsByChapterKey(materiKey);
        const questionsForSiswa = questionsWithAnswers.map(({ correctAnswer, jawaban_esai, ...q }) => q);
        res.status(200).json(questionsForSiswa);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.submitAnswers = async (req, res) => {
    const userId = req.userId;
    const { materiKey } = req.params;
    const { answers } = req.body; 

    try {
        const chapter = await Materi.findChapterByMateriKey(materiKey);
        if (!chapter) {
            return res.status(404).send({ message: "Bab tidak ditemukan." });
        }

        if (chapter.grading_mode === 'otomatis') {
            let score = 0;
            const questions = await Materi.getQuestionsByChapterKey(materiKey);
            
            const submissionId = await Materi.createSubmission(userId, chapter.id, 0, true, 'selesai');

            for (const ans of answers) {
                const question = questions.find(q => q.id === ans.questionId);
                let isCorrect = false;
                
                if (question) {
                    if (question.correctAnswer && question.correctAnswer.toLowerCase() === (ans.answer || '').toLowerCase()) {
                        isCorrect = true;
                        score += 10;
                    }
                    await Materi.saveStudentAnswer(submissionId, ans.questionId, ans.answer, isCorrect);
                }
            }
            
            await Materi.gradeSubmissionManually(submissionId, score);
            res.status(200).send({ message: "Jawaban berhasil dikumpulkan!", score });

        } else {
            const submissionId = await Materi.createSubmission(userId, chapter.id, null, false, 'selesai');
            for (const ans of answers) {
                const questionExists = await Materi.checkQuestionExists(ans.questionId);
                if(questionExists){
                    await Materi.saveStudentAnswer(submissionId, ans.questionId, ans.answer, null);
                }
            }
            res.status(200).send({ message: "Jawaban berhasil dikumpulkan dan akan dinilai oleh guru." });
        }

    } catch (error) {
        console.error("Submit Answer Error:", error);
        res.status(500).send({ message: "Terjadi kesalahan internal saat memproses jawaban." });
    }
};