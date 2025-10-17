// contoh-sesm-server/models/point.model.js
const db = require("../config/database.config.js");

const Point = {};

/**
 * Menambahkan poin untuk user dan mencatatnya ke riwayat.
 */
Point.addPoints = async (userId, points, activityType, activityDetails) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute(
            "INSERT INTO points_history (user_id, points_earned, activity_type, activity_details, created_at) VALUES (?, ?, ?, ?, NOW())",
            [userId, points, activityType, activityDetails]
        );
        await conn.execute(
            "UPDATE users SET points = points + ? WHERE id = ?",
            [points, userId]
        );
        await conn.commit();
        const [rows] = await conn.execute("SELECT points FROM users WHERE id = ?", [userId]);
        return rows.length > 0 ? rows[0].points : 0; // Return 0 jika user tidak ditemukan
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
 */
Point.getPointHistory = async (userId) => {
    const [rows] = await db.execute(
        "SELECT points_earned, activity_type, activity_details, created_at FROM points_history WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
    );
    return rows;
};

// --- FUNGSI DIPERBAIKI (Collation Fix) UNTUK RIWAYAT MATERI PER MAPEL ---
Point.getHistoryForSubject = async (userId, subjectName) => {
    // Tentukan collation default database/tabel Anda di sini (ganti jika perlu)
    const dbCollation = 'utf8mb4_unicode_ci'; // Ganti ke utf8mb4_general_ci jika itu default Anda

    const query = `
        SELECT
            ss.id,
            c.judul AS title,
            ss.score,
            ss.submission_date AS date,
            COALESCE((SELECT ph.points_earned
                      FROM points_history ph
                      WHERE ph.user_id = ss.user_id
                        AND ph.activity_type = 'MATERI_COMPLETION'
                        -- TAMBAHKAN COLLATE di sini
                        AND ph.activity_details COLLATE ${dbCollation} LIKE CONCAT('%', COALESCE(c.judul, 'FallbackJudulKosong') COLLATE ${dbCollation}, '%')
                      ORDER BY ph.created_at DESC
                      LIMIT 1
                     ), 820) AS points
        FROM student_submissions ss
        JOIN chapters c ON ss.chapter_id = c.id
        JOIN subjects s ON c.subject_id = s.id
        WHERE ss.user_id = ?
          AND s.nama_mapel = ?
          AND ss.status IN ('selesai', 'dinilai')
        ORDER BY ss.submission_date DESC
    `;
    try {
        const [rows] = await db.execute(query, [userId, subjectName]);
        return rows;
    } catch (error) {
        console.error(`Error fetching history for subject "${subjectName}" for user ${userId}:`, error);
        throw error;
    }
};


// --- FUNGSI RIWAYAT KUIS (Collation Fix) ---
Point.getQuizHistory = async (userId) => {
    const dbCollation = 'utf8mb4_unicode_ci'; // Ganti jika perlu

    const query = `
        SELECT
            qs.id,
            q.title,
            qs.score,
            qs.submitted_at as date,
            COALESCE((SELECT ph.points_earned
                     FROM points_history ph
                     WHERE ph.user_id = qs.user_id
                       AND ph.activity_type = 'QUIZ_COMPLETION'
                       -- TAMBAHKAN COLLATE di sini
                       AND ph.activity_details COLLATE ${dbCollation} LIKE CONCAT('%', COALESCE(q.title, 'FallbackJudulKuis') COLLATE ${dbCollation}, '%')
                     ORDER BY ph.created_at DESC
                     LIMIT 1
                    ), 600) AS points
        FROM quiz_submissions qs
        JOIN quizzes q ON qs.quiz_id = q.id
        WHERE qs.user_id = ?
        ORDER BY qs.submitted_at DESC
    `;
    try {
        const [rows] = await db.execute(query, [userId]);
        return rows;
    } catch (error) {
        console.error(`Error fetching quiz history for user ${userId}:`, error);
        throw error;
    }
};


/**
 * Mengambil total poin dan informasi peringkat user.
 */
Point.getSummary = async (userId) => {
    // ... (Fungsi ini tetap sama seperti sebelumnya) ...
    const [users] = await db.execute("SELECT points FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
        throw new Error("User tidak ditemukan.");
    }
    const currentUserPoints = users[0].points || 0; // Default 0 jika null

    const ranks = [
        { name: 'Murid Baru', points: 0, color: '#CD7F32', icon: 'bronze' },
        { name: 'Siswa Rajin', points: 5000, color: '#C0C0C0', icon: 'silver' },
        { name: 'Bintang Kelas', points: 12000, color: '#FFD700', icon: 'gold' },
        { name: 'Juara Harapan', points: 25000, color: '#4682B4', icon: 'platinum' },
        { name: 'Cendekiawan Muda', points: 50000, color: '#9370DB', icon: 'diamond' },
        { name: 'Legenda Sekolah', points: 100000, color: '#FF4500', icon: 'master' },
    ];

    let currentRank = ranks[0];
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (currentUserPoints >= ranks[i].points) {
            currentRank = ranks[i];
            break;
        }
    }

    let nextRank = null;
    const currentRankIndex = ranks.findIndex(r => r.name === currentRank.name);
    if (currentRankIndex < ranks.length - 1) {
        nextRank = ranks[currentRankIndex + 1];
    }

    return {
        totalPoints: currentUserPoints,
        currentRank,
        nextRank
    };
};

module.exports = Point;