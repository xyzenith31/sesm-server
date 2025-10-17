// contoh-sesm-server/controllers/point.controller.js
const Point = require("../models/point.model.js");

// Controller untuk mengambil ringkasan poin dan peringkat user
exports.getSummary = async (req, res) => {
    const userId = req.userId; // Didapat dari middleware verifyToken

    try {
        const summary = await Point.getSummary(userId);
        res.status(200).json(summary);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Controller untuk mengambil riwayat poin user
exports.getHistory = async (req, res) => {
    const userId = req.userId; // Didapat dari middleware verifyToken

    try {
        const history = await Point.getPointHistory(userId);
        res.status(200).json(history);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Controller untuk riwayat kuis
exports.getQuizHistory = async (req, res) => {
    const userId = req.userId;
    try {
        const history = await Point.getQuizHistory(userId);
        res.status(200).json(history);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Controller untuk riwayat materi per mapel
exports.getSubjectHistory = async (req, res) => {
    const userId = req.userId;
    const { subjectName } = req.params;
    try {
        const history = await Point.getHistoryForSubject(userId, subjectName);
        res.status(200).json(history);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

/**
 * PENTING: Controller ini sebaiknya TIDAK diekspos sebagai route publik.
 * Ini adalah contoh bagaimana Anda bisa memanggilnya dari controller lain
 * (misalnya, setelah user menyelesaikan kuis).
 */
exports.addPointsForActivity = async (req, res) => {
    const userId = req.userId;
    const { points, activityType, activityDetails } = req.body;

    if (!points || !activityType) {
        return res.status(400).send({ message: "Field 'points' dan 'activityType' dibutuhkan." });
    }

    try {
        const newTotalPoints = await Point.addPoints(userId, points, activityType, activityDetails);
        res.status(200).send({ 
            message: `Berhasil menambahkan ${points} poin!`,
            newTotalPoints: newTotalPoints 
        });
    } catch (error) {
        res.status(500).send({ message: "Gagal menambahkan poin." });
    }
};