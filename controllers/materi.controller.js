// contoh-server-sesm/controllers/materi.controller.js

const Materi = require("../models/materi.model.js");

// === UNTUK GURU / ADMIN ===

// Endpoint efisien untuk dashboard manajemen materi
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
        const questions = await Materi.getQuestionsByChapterKey(materiKey);
        const materiForSiswa = questions.map(({ correctAnswer, ...q }) => q);
        res.status(200).json(materiForSiswa);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};