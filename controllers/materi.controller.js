// contoh-server-sesm/controllers/materi.controller.js

const Materi = require("../models/materi.model.js");

// === UNTUK GURU / ADMIN ===

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
        const questions = await Materi.getQuestionsByChapterKey(materiKey);
        res.status(200).json({ questions });
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
        const newQuestion = await Materi.createQuestion(materiKey, req.body);
        res.status(201).json(newQuestion);
    } catch (error) {
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
        res.status(200).send({ message: "Soal berhasil dihapus." });
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
        // Logika ini diperbaiki agar hanya mengirim data yang dibutuhkan siswa
        const questionsWithAnswers = await Materi.getQuestionsByChapterKey(materiKey);
        const questionsForSiswa = questionsWithAnswers.map(({ correctAnswer, jawaban_esai, ...q }) => q); // Hapus kunci jawaban
        res.status(200).json(questionsForSiswa);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// --- FUNGSI SUBMIT JAWABAN (DIPERBAIKI) ---
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
                
                if (question) { // Validasi jika soal ada
                    if (question.correctAnswer && question.correctAnswer.toLowerCase() === (ans.answer || '').toLowerCase()) {
                        isCorrect = true;
                        score += 10;
                    }
                    await Materi.saveStudentAnswer(submissionId, ans.questionId, ans.answer, isCorrect);
                }
            }
            
            await Materi.gradeSubmissionManually(submissionId, score);

            res.status(200).send({ message: "Jawaban berhasil dikumpulkan!", score });

        } else { // Mode Manual
            const submissionId = await Materi.createSubmission(userId, chapter.id, null, false, 'selesai');
            for (const ans of answers) {
                // Pastikan questionId valid sebelum menyimpan
                const questionExists = await Materi.checkQuestionExists(ans.questionId);
                if(questionExists){
                    await Materi.saveStudentAnswer(submissionId, ans.questionId, ans.answer, null);
                }
            }
            res.status(200).send({ message: "Jawaban berhasil dikumpulkan dan akan dinilai oleh guru." });
        }

    } catch (error) {
        console.error("Submit Answer Error:", error); // Log error untuk debugging
        res.status(500).send({ message: "Terjadi kesalahan internal saat memproses jawaban." });
    }
};