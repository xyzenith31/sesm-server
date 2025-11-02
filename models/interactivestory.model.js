// contoh-sesm-server/models/interactivestory.model.js
const db = require("../config/database.config.js");

const InteractiveStory = {};

// [PERBAIKAN] Menambahkan 's.story_data' kembali ke SELECT
InteractiveStory.getAll = async () => {
    const [rows] = await db.execute(`
        SELECT s.id, s.title, s.synopsis, s.category, s.read_time, s.total_endings, s.cover_image, s.story_data, u.nama as creator_name
        FROM interactive_stories s
        LEFT JOIN users u ON s.creator_id = u.id
        ORDER BY s.created_at DESC
    `);
    
    // [PERBAIKAN] Pastikan story_data di-parse jika masih string
    return rows.map(row => {
        if (typeof row.story_data === 'string') {
            try {
                row.story_data = JSON.parse(row.story_data);
            } catch (e) {
                console.error(`Gagal parse story_data untuk ID ${row.id}`);
                row.story_data = null; // Set null jika JSON rusak
            }
        }
        return row;
    });
};

// Mengambil data JSON cerita berdasarkan ID
InteractiveStory.findById = async (id) => {
    const [rows] = await db.execute("SELECT story_data FROM interactive_stories WHERE id = ?", [id]);
    
    if (rows.length === 0) return null;
    
    let storyData = rows[0].story_data;
    
    // Pastikan data adalah objek (mysql2 biasanya auto-parse)
    if (typeof storyData === 'string') {
        try {
            return JSON.parse(storyData);
        } catch (e) {
            console.error(`Gagal parse story_data (findById) untuk ID ${id}`);
            return null;
        }
    }
    return storyData; // Kembalikan objek yang sudah di-parse
};

// [FUNGSI BARU] Untuk mengambil path file sebelum dihapus
InteractiveStory.getStoryPaths = async (id) => {
     const [rows] = await db.execute("SELECT cover_image, story_data FROM interactive_stories WHERE id = ?", [id]);
     
     if (rows.length === 0) return null;

     let storyData = rows[0].story_data;
     if (typeof storyData === 'string') {
        try {
            storyData = JSON.parse(storyData);
        } catch (e) {
            storyData = null;
        }
     }
     
    return {
        cover_image: rows[0].cover_image,
        story_data: storyData // Kembalikan sebagai objek
    };
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