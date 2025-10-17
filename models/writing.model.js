// contoh-sesm-server/models/writing.model.js
const db = require("../config/database.config.js");

const WritingProject = {};

WritingProject.findAllByUser = async (userId) => {
    // PASTIKAN NAMA KOLOM `updated_at` SESUAI DENGAN DATABASE ANDA
    const [rows] = await db.execute("SELECT uuid as id, title, content, updated_at as lastModified FROM creative_writing_projects WHERE user_id = ? ORDER BY updated_at DESC", [userId]);
    return rows;
};

WritingProject.create = async (projectData) => {
    const { uuid, userId, title, content } = projectData;
    const [result] = await db.execute(
        "INSERT INTO creative_writing_projects (uuid, user_id, title, content) VALUES (?, ?, ?, ?)",
        [uuid, userId, title, content || ''] // Pastikan content tidak null
    );
    // Kembalikan data yang konsisten dengan findAllByUser
    return { id: uuid, userId, title, content: content || '' };
};

WritingProject.update = async (uuid, userId, data) => {
    const [result] = await db.execute(
        "UPDATE creative_writing_projects SET title = ?, content = ? WHERE uuid = ? AND user_id = ?",
        [data.title, data.content, uuid, userId]
    );
    return result.affectedRows;
};

WritingProject.delete = async (uuid, userId) => {
    const [result] = await db.execute("DELETE FROM creative_writing_projects WHERE uuid = ? AND user_id = ?", [uuid, userId]);
    return result.affectedRows;
};

module.exports = WritingProject;