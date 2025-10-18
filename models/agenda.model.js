// contoh-sesm-server/models/agenda.model.js
const db = require("../config/database.config.js");

const Agenda = {};

// Membuat agenda baru
Agenda.create = async (agendaData) => {
    const { userId, title, date, description, color } = agendaData;
    const query = "INSERT INTO agendas (user_id, title, date, description, color) VALUES (?, ?, ?, ?, ?)";
    
    // Perbaikan: Menangani nilai default secara eksplisit
    const params = [
        userId,
        title,
        date,
        description || null, // Jika deskripsi kosong, kirim NULL
        color || '#3B82F6'   // Jika warna kosong, gunakan warna default
    ];

    const [result] = await db.execute(query, params);
    return { id: result.insertId, ...agendaData };
};

// Mengambil semua agenda milik user dalam rentang waktu
Agenda.findByUserAndDateRange = async (userId, startDate, endDate) => {
    const query = "SELECT id, title, date, description, color FROM agendas WHERE user_id = ? AND date BETWEEN ? AND ?";
    const [rows] = await db.execute(query, [userId, startDate, endDate]);
    return rows;
};

// Menghapus agenda
Agenda.delete = async (agendaId, userId) => {
    const query = "DELETE FROM agendas WHERE id = ? AND user_id = ?";
    const [result] = await db.execute(query, [agendaId, userId]);
    return result.affectedRows;
};

module.exports = Agenda;