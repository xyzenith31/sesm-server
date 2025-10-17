// contoh-sesm-server/models/drawing.model.js
const db = require("../config/database.config.js");

const DrawingProject = {};

DrawingProject.findAllByUser = async (userId) => {
    const [rows] = await db.execute("SELECT uuid as id, title, image_data as imageData, updated_at as lastModified FROM drawing_projects WHERE user_id = ? ORDER BY updated_at DESC", [userId]);
    return rows;
};

DrawingProject.create = async (projectData) => {
    const { uuid, userId, title, imageData } = projectData;
    const [result] = await db.execute(
        "INSERT INTO drawing_projects (uuid, user_id, title, image_data) VALUES (?, ?, ?, ?)",
        [uuid, userId, title, imageData]
    );
    // ✅ PERBAIKAN: Mengembalikan objek yang lebih bersih dan konsisten
    return { id: uuid, userId, title, imageData: imageData || null };
};

DrawingProject.update = async (uuid, userId, data) => {
    const [result] = await db.execute(
        "UPDATE drawing_projects SET title = ?, image_data = ? WHERE uuid = ? AND user_id = ?",
        [data.title, data.imageData, uuid, userId]
    );
    return result.affectedRows;
};

DrawingProject.delete = async (uuid, userId) => {
    const [result] = await db.execute("DELETE FROM drawing_projects WHERE uuid = ? AND user_id = ?", [uuid, userId]);
    return result.affectedRows;
};

module.exports = DrawingProject;