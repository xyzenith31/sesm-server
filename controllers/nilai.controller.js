// contoh-server-sesm/controllers/nilai.controller.js
const Materi = require("../models/materi.model.js");

// Mengubah mode penilaian
exports.updateGradingMode = async (req, res) => {
    const { chapterId } = req.params;
    const { mode } = req.body;

    if (!['otomatis', 'manual'].includes(mode)) {
        return res.status(400).send({ message: "Mode tidak valid." });
    }

    try {
        await Materi.updateGradingMode(chapterId, mode);
        res.status(200).send({ message: `Mode penilaian berhasil diubah ke ${mode}.` });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Mendapatkan daftar submission untuk satu bab
exports.getSubmissionsForChapter = async (req, res) => {
    const { chapterId } = req.params;
    try {
        const submissions = await Materi.getAllSubmissionsForChapter(chapterId);
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Mendapatkan detail jawaban dari satu submission
exports.getSubmissionDetails = async (req, res) => {
    const { submissionId } = req.params;
    try {
        const details = await Materi.getSubmissionDetails(submissionId);
        res.status(200).json(details);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};


// Memberikan nilai manual untuk pertama kali
exports.gradeSubmission = async (req, res) => {
    const { submissionId } = req.params;
    const { score } = req.body;

    if (score === undefined || score === null) {
        return res.status(400).send({ message: "Nilai dibutuhkan." });
    }

    try {
        const affectedRows = await Materi.gradeSubmissionManually(submissionId, score);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Submission tidak ditemukan." });
        }
        res.status(200).send({ message: "Nilai berhasil diberikan." });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// --- CONTROLLER BARU UNTUK OVERRIDE JAWABAN ---
exports.overrideAnswer = async (req, res) => {
    const { answerId } = req.params;
    const { isCorrect } = req.body;

    try {
        const submissionId = await Materi.getSubmissionIdFromAnswer(answerId);
        if (!submissionId) {
            return res.status(404).send({ message: "Jawaban tidak ditemukan." });
        }

        // Ubah status jawaban
        await Materi.overrideAnswerCorrectness(answerId, isCorrect);

        // Hitung ulang skor total dan update
        const newScore = await Materi.recalculateScore(submissionId);

        res.status(200).send({ message: "Status jawaban berhasil diubah.", newScore });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};