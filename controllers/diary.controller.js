const Diary = require("../models/diary.model.js");

// Membuat entri baru
exports.createEntry = async (req, res) => {
    const userId = req.userId;
    const { content } = req.body;
    if (!content || content.trim() === '') {
        return res.status(400).send({ message: "Konten tidak boleh kosong." });
    }
    try {
        const newEntry = await Diary.create(userId, content);
        res.status(201).send(newEntry);
    } catch (error) {
        res.status(500).send({ message: "Gagal menyimpan entri: " + error.message });
    }
};

// Mendapatkan semua entri
exports.getAllEntries = async (req, res) => {
    const userId = req.userId;
    try {
        const entries = await Diary.findByUser(userId);
        res.status(200).json(entries);
    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil entri: " + error.message });
    }
};

// Memperbarui entri
exports.updateEntry = async (req, res) => {
    const userId = req.userId;
    const { entryId } = req.params;
    const { content } = req.body;
    if (!content || content.trim() === '') {
        return res.status(400).send({ message: "Konten tidak boleh kosong." });
    }
    try {
        const affectedRows = await Diary.update(entryId, userId, content);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Entri tidak ditemukan atau Anda tidak memiliki izin." });
        }
        res.status(200).send({ message: "Entri berhasil diperbarui." });
    } catch (error) {
        res.status(500).send({ message: "Gagal memperbarui entri: " + error.message });
    }
};

// Menghapus entri
exports.deleteEntry = async (req, res) => {
    const userId = req.userId;
    const { entryId } = req.params;
    try {
        const affectedRows = await Diary.delete(entryId, userId);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Entri tidak ditemukan atau Anda tidak memiliki izin." });
        }
        res.status(200).send({ message: "Entri berhasil dihapus." });
    } catch (error) {
        res.status(500).send({ message: "Gagal menghapus entri: " + error.message });
    }
};