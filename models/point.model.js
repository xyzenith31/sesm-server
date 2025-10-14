// contoh-sesm-server/models/point.model.js
const db = require("../config/database.config.js");

const Point = {};

/**
 * Menambahkan poin untuk user dan mencatatnya ke riwayat.
 * Fungsi ini menggunakan transaksi untuk memastikan integritas data.
 * @param {number} userId - ID dari user yang menerima poin.
 * @param {number} points - Jumlah poin yang ditambahkan.
 * @param {string} activityType - Jenis aktivitas (e.g., 'QUIZ_COMPLETION').
 * @param {string} activityDetails - Deskripsi singkat aktivitas.
 * @returns {Promise<number>} - Mengembalikan total poin baru dari user.
 */
Point.addPoints = async (userId, points, activityType, activityDetails) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Catat ke tabel points_history
        await conn.execute(
            "INSERT INTO points_history (user_id, points_earned, activity_type, activity_details) VALUES (?, ?, ?, ?)",
            [userId, points, activityType, activityDetails]
        );

        // 2. Update total poin di tabel users
        await conn.execute(
            "UPDATE users SET points = points + ? WHERE id = ?",
            [points, userId]
        );

        await conn.commit();

        // Ambil total poin terbaru setelah update
        const [rows] = await conn.execute("SELECT points FROM users WHERE id = ?", [userId]);
        return rows[0].points;

    } catch (error) {
        await conn.rollback();
        console.error("Gagal menambahkan poin (rollback):", error);
        throw error;
    } finally {
        conn.release();
    }
};

/**
 * Mengambil riwayat perolehan poin untuk seorang user.
 * @param {number} userId - ID dari user.
 * @returns {Promise<Array>} - Daftar riwayat poin.
 */
Point.getPointHistory = async (userId) => {
    const [rows] = await db.execute(
        "SELECT points_earned, activity_type, activity_details, created_at FROM points_history WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
    );
    return rows;
};

// --- FUNGSI BARU UNTUK RIWAYAT MATERI PER MAPEL ---
Point.getHistoryForSubject = async (userId, subjectName) => {
    const query = `
        SELECT 
            ss.id,
            c.judul as title,
            ss.score,
            ss.submission_date as date,
            ph.points_earned as points
        FROM student_submissions ss
        JOIN chapters c ON ss.chapter_id = c.id
        JOIN subjects s ON c.subject_id = s.id
        LEFT JOIN points_history ph ON (ph.activity_details LIKE CONCAT('%', c.judul, '%') AND ph.user_id = ss.user_id)
        WHERE ss.user_id = ? AND s.nama_mapel = ? AND ss.status = 'selesai'
        ORDER BY ss.submission_date DESC
    `;
    const [rows] = await db.execute(query, [userId, subjectName]);
    // Memberikan nilai default 820 jika poin tidak tercatat di history
    return rows.map(row => ({ ...row, points: row.points || 820 }));
};


// --- FUNGSI DIPERBAIKI ---
Point.getQuizHistory = async (userId) => {
    const query = `
        SELECT 
            qs.id,
            q.title,
            qs.score,
            qs.submitted_at as date,
            600 as points 
        FROM quiz_submissions qs
        JOIN quizzes q ON qs.quiz_id = q.id
        WHERE qs.user_id = ?
        ORDER BY qs.submitted_at DESC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
};


/**
 * Mengambil total poin dan informasi peringkat user.
 * @param {number} userId - ID dari user.
 * @returns {Promise<Object>} - Objek berisi total poin dan detail peringkat.
 */
Point.getSummary = async (userId) => {
    const [users] = await db.execute("SELECT points FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
        throw new Error("User tidak ditemukan.");
    }
    const currentUserPoints = users[0].points;

    // Logika peringkat diambil dari RankPage.jsx
    const ranks = [
        { name: 'Murid Baru', points: 0, color: '#CD7F32', icon: 'bronze' },
        { name: 'Siswa Rajin', points: 5000, color: '#C0C0C0', icon: 'silver' },
        { name: 'Bintang Kelas', points: 12000, color: '#FFD700', icon: 'gold' },
        { name: 'Juara Harapan', points: 25000, color: '#4682B4', icon: 'platinum' },
        { name: 'Cendekiawan Muda', points: 50000, color: '#9370DB', icon: 'diamond' },
        { name: 'Legenda Sekolah', points: 100000, color: '#FF4500', icon: 'master' },
    ];

    const currentRankIndex = ranks.slice().reverse().findIndex(r => currentUserPoints >= r.points);
    const currentRank = ranks[ranks.length - 1 - currentRankIndex];
    const nextRank = ranks[ranks.length - currentRankIndex];
    
    return {
        totalPoints: currentUserPoints,
        currentRank,
        nextRank
    };
};


module.exports = Point;