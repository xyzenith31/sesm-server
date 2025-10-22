// contoh-sesm-server/controllers/feedbackController.js
const db = require("../config/database.config.js"); // ✅ PASTIKAN ini di-import
const fs = require('fs').promises; // Untuk hapus file jika error

/*
* Controller untuk USER (Siswa) MENGIRIM feedback baru
*/

exports.submitFeedback = async (req, res) => {
    // ... (kode submitFeedback Anda yang sudah ada, tidak perlu diubah)
    const { type, title, page_context, description } = req.body;
    const userId = req.userId; 
    let attachmentUrl = null;
    if (req.file) {
        attachmentUrl = `/uploads/feedback/${req.file.filename}`;
    }
    
    if (!type || !description || !userId) {
        if (req.file) {
             fs.unlink(req.file.path).catch(err => console.error("Gagal hapus file (validasi):", err));
        }
        return res.status(400).send({ message: "Data tidak lengkap (tipe, deskripsi, atau user tidak terdeteksi)." });
    }
    
    if ((type === 'bug' || type === 'fitur') && (!title || title.trim() === '')) {
         if (req.file) {
             fs.unlink(req.file.path).catch(err => console.error("Gagal hapus file (validasi judul):", err));
         }
        return res.status(400).send({ message: "Judul wajib diisi untuk laporan bug atau usulan fitur." });
    }

    try {
        const query = `
            INSERT INTO feedback_reports 
            (user_id, type, title, page_context, description, attachment_url, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'baru')
        `;
        
        await db.execute(query, [
            userId,
            type,
            title || null, 
            page_context || null,
            description,
            attachmentUrl
        ]);

        res.status(201).send({ message: "Feedback berhasil dikirim. Terima kasih atas masukan Anda!" });

    } catch (error) {
        console.error("Error submitting feedback:", error);
         if (req.file) {
             fs.unlink(req.file.path).catch(err => console.error("Gagal hapus file (DB error):", err));
         }
        res.status(500).send({ message: "Gagal menyimpan feedback ke database.", error: error.message });
    }
};


/*
* ✅ BARU: Controller untuk USER (Siswa) MELIHAT riwayat feedback-nya
*/
exports.getMyFeedback = async (req, res) => {
    const userId = req.userId; // Diambil dari middleware authJwt.verifyToken

    if (!userId) {
        return res.status(403).send({ message: "User tidak terautentikasi." });
    }

    try {
        const [reports] = await db.execute(
            `SELECT id, type, title, status, admin_notes, created_at 
             FROM feedback_reports 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 10`, // Batasi 10 laporan terbaru
            [userId]
        );

        res.status(200).send(reports);

    } catch (error) {
        console.error("Error fetching user feedback:", error);
        res.status(500).send({ message: 'Gagal mengambil riwayat laporan.' });
    }
};