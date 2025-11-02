// contoh-sesm-server/models/interactivestory.model.js
const db = require("../config/database.config.js");

const InteractiveStory = {};

// [PERBAIKAN] getAll: Hapus 's.story_data' dari SELECT. Tidak efisien.
InteractiveStory.getAll = async () => {
    const [rows] = await db.execute(`
        SELECT s.id, s.title, s.synopsis, s.category, s.read_time, s.total_endings, s.cover_image, u.nama as creator_name
        FROM interactive_stories s
        LEFT JOIN users u ON s.creator_id = u.id
        ORDER BY s.created_at DESC
    `);
    return rows;
};

// Mengambil data JSON cerita berdasarkan ID
InteractiveStory.findById = async (id) => {
    const [rows] = await db.execute("SELECT story_data FROM interactive_stories WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0].story_data : null;
};

// [FUNGSI BARU] Untuk mengambil path file sebelum dihapus
InteractiveStory.getStoryPaths = async (id) => {
     const [rows] = await db.execute("SELECT cover_image, story_data FROM interactive_stories WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0] : null;
};

// Membuat cerita baru
InteractiveStory.create = async (storyData) => {
    const { id, title, synopsis, category, read_time, total_endings, cover_image, story_data, creator_id } = storyData;
    const query = `
        INSERT INTO interactive_stories (id, title, synopsis, category, read_time, total_endings, cover_image, story_data, creator_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [id, title, synopsis, category, read_time, total_endings, cover_image, story_data, creator_id]);
    return { insertId: result.insertId, ...storyData };
};

// Memperbarui cerita
InteractiveStory.update = async (id, storyData) => {
    const { title, synopsis, category, read_time, total_endings, cover_image, story_data } = storyData;
    const query = `
        UPDATE interactive_stories SET
            title = ?, synopsis = ?, category = ?, read_time = ?, total_endings = ?, story_data = ?
            ${cover_image ? ', cover_image = ?' : ''}
        WHERE id = ?
    `;
    const params = [title, synopsis, category, read_time, total_endings, story_data];
    if (cover_image) params.push(cover_image);
    params.push(id);

    const [result] = await db.execute(query, params);
    return result.affectedRows;
};

// Menghapus cerita
InteractiveStory.delete = async (id) => {
    const [result] = await db.execute("DELETE FROM interactive_stories WHERE id = ?", [id]);
    return result.affectedRows;
};

// Mencatat penyelesaian cerita oleh siswa
InteractiveStory.recordCompletion = async (userId, storyId, endingKey) => {
    const [result] = await db.execute(
        "INSERT IGNORE INTO interactive_story_submissions (user_id, story_id, ending_key) VALUES (?, ?, ?)",
        [userId, storyId, endingKey]
    );
    return result.affectedRows;
};

// Mengambil data pengerjaan untuk sebuah cerita
InteractiveStory.getSubmissions = async (storyId) => {
    const [rows] = await db.execute(`
        SELECT u.nama, iss.completed_at, iss.ending_key
        FROM interactive_story_submissions iss
        JOIN users u ON iss.user_id = u.id
        WHERE iss.story_id = ?
        ORDER BY iss.completed_at DESC
    `, [storyId]);
    return rows;
};


module.exports = InteractiveStory;