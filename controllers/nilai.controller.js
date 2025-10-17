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
        const affectedRows = await Materi.updateGradingMode(chapterId, mode);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Materi tidak ditemukan." });
        }
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

// Fungsi untuk menyimpan nilai dan umpan balik
exports.gradeSubmission = async (req, res) => {
    const { submissionId } = req.params;
    const { score, answers } = req.body;

    if (score === undefined || score === null || isNaN(score) || score < 0 || score > 100) {
        return res.status(400).send({ message: "Nilai dibutuhkan dan harus antara 0-100." });
    }

    try {
        if (answers && Array.isArray(answers)) {
            for (const ans of answers) {
                if (ans.answerId && ans.correction_text !== undefined) {
                    await Materi.updateAnswerDetails(ans.answerId, { correction_text: ans.correction_text });
                }
            }
        }
        
        const affectedRows = await Materi.gradeSubmissionManually(submissionId, parseInt(score));
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Submission tidak ditemukan." });
        }
        
        res.status(200).send({ message: "Nilai dan umpan balik berhasil disimpan." });

    } catch (error) {
        console.error("Grade Submission Error:", error);
        res.status(500).send({ message: "Gagal menyimpan nilai: " + error.message });
    }
};

// Fungsi untuk override jawaban benar/salah
exports.overrideAnswer = async (req, res) => {
    const { answerId } = req.params;
    const { isCorrect } = req.body;

    if (typeof isCorrect !== 'boolean') {
        return res.status(400).send({ message: "Status kebenaran (isCorrect) harus true atau false." });
    }

    try {
        const affectedRows = await Materi.overrideAnswerCorrectness(answerId, isCorrect);

        if (affectedRows === 0) {
            return res.status(404).send({ message: "Jawaban tidak ditemukan atau gagal diubah." });
        }
        
        res.status(200).send({
            message: "Status jawaban berhasil diubah. Jangan lupa simpan nilai akhir jika diperlukan.",
            newStatus: isCorrect
        });
    } catch (error) {
        console.error("Override Answer Error:", error);
        res.status(500).send({ message: "Gagal mengubah status jawaban: " + error.message });
    }
};