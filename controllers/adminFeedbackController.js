// contoh-sesm-server/controllers/adminFeedbackController.js
const db = require("../config/database.config.js"); 

/*
* Controller untuk ADMIN (Guru) MELIHAT & MENGELOLA feedback
*/

exports.getAllFeedback = async (req, res) => {
    // Ambil query params dengan nilai default
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || 'created_at'; 
    const sortDir = req.query.sortDir || 'DESC';
    const { status, type } = req.query;
    
    // Hitung offset
    const offset = (page - 1) * limit;

    try {
        let whereClauses = [];
        let params = []; // Ini array dasar HANYA untuk filter WHERE
        
        if (status && status !== 'semua') {
            whereClauses.push("fr.status = ?");
            params.push(status);
        }
        if (type && type !== 'semua') {
            whereClauses.push("fr.type = ?");
            params.push(type);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        const allowedSortCols = ['created_at', 'type', 'status', 'page_context'];
        const safeSortBy = allowedSortCols.includes(sortBy) ? `fr.${sortBy}` : 'fr.created_at';
        const safeSortDir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const orderSql = `ORDER BY ${safeSortBy} ${safeSortDir}`;
        
        // --- ✅ PERBAIKAN UTAMA DI SINI ---

        // 1. Parameter untuk COUNT (HANYA parameter WHERE)
        const countParams = [...params]; 
        
        // 2. Parameter untuk DATA (HANYA parameter WHERE)
        // offset dan limit akan dimasukkan langsung ke string query
        const dataParams = [...params]; 
        
        // --- AKHIR PERBAIKAN ---

        const countQuery = `SELECT COUNT(*) as total FROM feedback_reports fr ${whereSql}`;
        
        // --- ✅ PERBAIKAN SQL DI SINI ---
        // Ganti 'LIMIT ?, ?' menjadi 'LIMIT [angka] OFFSET [angka]'
        // Ini aman karena 'limit' dan 'offset' sudah di-parseInt di atas
        const dataQuery = `
            SELECT fr.*, 
                   u.nama as reporter_nama, 
                   u.username as reporter_username, 
                   u.email as reporter_email
            FROM feedback_reports fr
            LEFT JOIN users u ON fr.user_id = u.id
            ${whereSql}
            ${orderSql}
            LIMIT ${limit} OFFSET ${offset}
        `;
        // --- AKHIR PERBAIKAN SQL ---

        // Eksekusi COUNT query dengan parameter COUNT
        const [countResult] = await db.execute(countQuery, countParams);
        
        // Eksekusi DATA query (baris 73) dengan parameter DATA
        // dataParams sekarang HANYA berisi parameter WHERE
        const [rows] = await db.execute(dataQuery, dataParams);

        const totalItems = countResult.length > 0 ? countResult[0].total : 0;
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).send({
            totalItems: totalItems,
            totalPages: totalPages,
            currentPage: page,
            reports: rows,
        });

    } catch (error) {
        // Ini yang kamu lihat di terminal
        console.error("Error fetching feedback:", error); 
        res.status(500).send({ message: 'Gagal memuat laporan.', error: error.message });
    }
};

// --- Fungsi lainnya (Salin semua untuk pastikan lengkap) ---

exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['baru', 'dilihat', 'diproses', 'selesai', 'ditolak'];

    if (!validStatuses.includes(status)) {
        return res.status(400).send({ message: 'Status tidak valid.' });
    }
    try {
        const [result] = await db.execute(
            "UPDATE feedback_reports SET status = ? WHERE id = ?",
            [status, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Laporan tidak ditemukan.' });
        }
        res.status(200).send({ message: 'Status laporan berhasil diperbarui.' });
    } catch (error) {
        console.error("Error updating feedback status:", error);
        res.status(500).send({ message: 'Gagal memperbarui status.' });
    }
};

exports.updateAdminNotes = async (req, res) => {
    const { id } = req.params;
    const { adminNotes } = req.body;

    try {
        const [result] = await db.execute(
            "UPDATE feedback_reports SET admin_notes = ? WHERE id = ?",
            [adminNotes, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Laporan tidak ditemukan.' });
        }
        res.status(200).send({ message: 'Catatan admin berhasil diperbarui.' });
    } catch (error) {
        console.error("Error updating admin notes:", error);
        res.status(500).send({ message: 'Gagal memperbarui catatan admin.' });
    }
};

exports.deleteFeedback = async (req, res) => {
    const { id } = req.params;
    try {
        const [reportData] = await db.execute("SELECT attachment_url FROM feedback_reports WHERE id = ?", [id]);
        if (reportData.length > 0 && reportData[0].attachment_url) {
            const fs = require('fs').promises;
            const path = require('path');
            const filePath = path.join(__dirname, '..', '..', reportData[0].attachment_url); 
            fs.unlink(filePath).catch(err => console.error("Gagal hapus file lampiran (bisa diabaikan):", err));
        }

        const [result] = await db.execute(
            "DELETE FROM feedback_reports WHERE id = ?",
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Laporan tidak ditemukan.' });
        }
        res.status(200).send({ message: 'Laporan berhasil dihapus.' });
    } catch (error) {
        console.error("Error deleting feedback:", error);
        res.status(500).send({ message: 'Gagal menghapus laporan.' });
    }
};