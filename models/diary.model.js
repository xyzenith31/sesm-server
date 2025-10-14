const db = require("../config/database.config.js");

const Diary = {};

// Membuat entri baru
Diary.create = async (userId, content) => {
    const query = "INSERT INTO diary_entries (user_id, content, entry_date) VALUES (?, ?, CURDATE())";
    const [result] = await db.execute(query, [userId, content]);
    return { id: result.insertId, user_id: userId, content };
};

// Mengambil semua entri milik user
Diary.findByUser = async (userId) => {
    const query = "SELECT id, content, entry_date, created_at FROM diary_entries WHERE user_id = ? ORDER BY entry_date DESC, created_at DESC";
    const [rows] = await db.execute(query, [userId]);
    return rows;
};

// Memperbarui entri
Diary.update = async (entryId, userId, content) => {
    const query = "UPDATE diary_entries SET content = ? WHERE id = ? AND user_id = ?";
    const [result] = await db.execute(query, [content, entryId, userId]);
    return result.affectedRows;
};

// Menghapus entri
Diary.delete = async (entryId, userId) => {
    const query = "DELETE FROM diary_entries WHERE id = ? AND user_id = ?";
    const [result] = await db.execute(query, [entryId, userId]);
    return result.affectedRows;
};

// Mencari entri untuk verifikasi kepemilikan
Diary.findById = async (entryId, userId) => {
    const query = "SELECT id FROM diary_entries WHERE id = ? AND user_id = ?";
    const [rows] = await db.execute(query, [entryId, userId]);
    return rows[0];
};


module.exports = Diary;