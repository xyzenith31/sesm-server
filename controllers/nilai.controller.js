// contoh-server-sesm/controllers/nilai.controller.js
const Materi = require("../models/materi.model.js");

// Mengubah mode penilaian
exports.updateGradingMode = async (req, res) => {
    const { chapterId } = req.params;
    const { mode } = req.body; // 'otomatis' atau 'manual'

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

// Mendapatkan daftar submission yang perlu dinilai
exports.getSubmissionsForGrading = async (req, res) => {
    const { chapterId } = req.params;
    try {
        const submissions = await Materi.getSubmissionsForGrading(chapterId);
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


// Memberikan nilai manual
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

exports.getSubmissionsForChapter = async (req, res) => {
    const { chapterId } = req.params;
    try {
        // Panggil fungsi baru dari model
        const submissions = await Materi.getAllSubmissionsForChapter(chapterId);
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};