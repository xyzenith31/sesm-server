// contoh-sesm-server/models/draft.model.js
const db = require("../config/database.config.js");

const Draft = {};

Draft.save = async (userId, draftKey, draftData) => {
    const query = `
        INSERT INTO drafts (user_id, draft_key, content, last_saved) 
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE content = ?, last_saved = NOW()
    `;
    const [result] = await db.execute(query, [userId, draftKey, JSON.stringify(draftData), JSON.stringify(draftData)]);
    return result;
};

Draft.get = async (userId, draftKey) => {
    const [rows] = await db.execute("SELECT content, last_saved FROM drafts WHERE user_id = ? AND draft_key = ?", [userId, draftKey]);
    if (rows.length > 0) {
        return {
            content: JSON.parse(rows[0].content),
            last_saved: rows[0].last_saved
        };
    }
    return null;
};

Draft.getAll = async (userId) => {
    const [rows] = await db.execute("SELECT draft_key, content, last_saved FROM drafts WHERE user_id = ?", [userId]);
    return rows.map(row => ({
        draft_key: row.draft_key,
        content: JSON.parse(row.content),
        last_saved: row.last_saved
    }));
};

Draft.delete = async (userId, draftKey) => {
    const [result] = await db.execute("DELETE FROM drafts WHERE user_id = ? AND draft_key = ?", [userId, draftKey]);
    return result.affectedRows;
};

module.exports = Draft;