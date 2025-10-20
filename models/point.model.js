// contoh-sesm-server/models/point.model.js
const db = require("../config/database.config.js");

const Point = {};

/**
 * Menambahkan poin untuk user dan mencatatnya ke riwayat.
 * PERBAIKAN: Melepas transaction eksplisit untuk mencoba mengurangi deadlock,
 * mengandalkan atomicity per statement.
 */
Point.addPoints = async (userId, points, activityType, activityDetails) => {
    // Pastikan points adalah angka
    const pointsToAdd = Number(points);
    if (isNaN(pointsToAdd)) {
        console.error(`[ERROR] Invalid points value for userId ${userId}:`, points);
        throw new Error("Nilai poin tidak valid.");
    }
     // Jangan tambahkan poin jika nilainya 0 atau kurang
     if (pointsToAdd <= 0) {
        console.log(`[INFO] Skipping point addition for userId ${userId} because pointsToAdd is ${pointsToAdd}.`);
        // Ambil total poin saat ini saja
         const [rows] = await db.execute("SELECT points FROM users WHERE id = ?", [userId]);
         return rows.length > 0 ? rows[0].points : 0;
    }


    try {
        console.log(`[Point.addPoints] Attempting to add ${pointsToAdd} points for user ${userId}, type: ${activityType}`);
        // 1. Catat riwayat terlebih dahulu
        await db.execute(
            "INSERT INTO points_history (user_id, points_earned, activity_type, activity_details, created_at) VALUES (?, ?, ?, ?, NOW())",
            [userId, pointsToAdd, activityType, activityDetails]
        );
        console.log(`[Point.addPoints] History inserted for user ${userId}.`);


        // 2. Update total poin pengguna
        await db.execute(
            "UPDATE users SET points = points + ? WHERE id = ?",
            [pointsToAdd, userId]
        );
        console.log(`[Point.addPoints] User points updated for user ${userId}.`);


        // 3. Ambil total poin baru (opsional, tergantung kebutuhan)
        const [rows] = await db.execute("SELECT points FROM users WHERE id = ?", [userId]);
         console.log(`[Point.addPoints] Fetched new total points for user ${userId}: ${rows[0]?.points}`);
        return rows.length > 0 ? (rows[0].points ?? 0) : 0; // Pastikan return 0 jika poin null

    } catch (error) {
        // Log error spesifik yang terjadi
        console.error(`[FATAL] Gagal menambahkan poin untuk userId ${userId}:`, error);
        // Melempar ulang error agar controller bisa menangani
        throw error;
    }
    // Tidak perlu release koneksi jika menggunakan pool.promise()
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

// --- FUNGSI RIWAYAT MATERI PER MAPEL ---
Point.getHistoryForSubject = async (userId, subjectName) => {
    // Ganti 'utf8mb4_unicode_ci' jika default collation database Anda berbeda
    const dbCollation = 'utf8mb4_unicode_ci';
    const query = `
        SELECT
            ss.id,
            c.judul AS title,
            ss.score,
            ss.submission_date AS date,
            -- Ambil poin yang tercatat di history, fallback ke 820
            COALESCE((SELECT ph.points_earned
                      FROM points_history ph
                      WHERE ph.user_id = ss.user_id
                        AND ph.activity_type = 'MATERI_COMPLETION'
                        AND ph.activity_details COLLATE ${dbCollation} LIKE CONCAT('%', COALESCE(c.judul, 'FallbackJudulKosong') COLLATE ${dbCollation}, '%')
                      -- Cari yang paling mendekati waktu submit
                      ORDER BY ABS(TIMESTAMPDIFF(SECOND, ph.created_at, ss.submission_date)) ASC
                      LIMIT 1
                     ), 0) AS points -- Fallback ke 0 jika tidak ada di history
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
        // Pastikan poin tidak null
        return rows.map(row => ({ ...row, points: row.points ?? 0 }));
    } catch (error) {
        console.error(`Error fetching history for subject "${subjectName}" for user ${userId}:`, error);
        throw error;
    }
};

// --- FUNGSI RIWAYAT KUIS ---
Point.getQuizHistory = async (userId) => {
    // Ganti 'utf8mb4_unicode_ci' jika default collation database Anda berbeda
    const dbCollation = 'utf8mb4_unicode_ci';
    const query = `
        SELECT
            qs.id,
            q.title,
            qs.score,           -- Skor persentase
            qs.points_earned,   -- Total poin didapat
            qs.submitted_at as date,
            -- Ambil poin yang tercatat di history, fallback ke points_earned
            COALESCE((SELECT ph.points_earned
                     FROM points_history ph
                     WHERE ph.user_id = qs.user_id
                       AND ph.activity_type = 'QUIZ_COMPLETION'
                       AND ph.activity_details COLLATE ${dbCollation} LIKE CONCAT('%', COALESCE(q.title, 'FallbackJudulKuis') COLLATE ${dbCollation}, '%')
                       -- Cari yang paling mendekati waktu submit kuis jika ada multiple
                       ORDER BY ABS(TIMESTAMPDIFF(SECOND, ph.created_at, qs.submitted_at)) ASC
                     LIMIT 1
                    ), qs.points_earned, 0) AS points -- Fallback ke points_earned dari submission, lalu 0
        FROM quiz_submissions qs
        JOIN quizzes q ON qs.quiz_id = q.id
        WHERE qs.user_id = ?
        ORDER BY qs.submitted_at DESC
    `;
    try {
        const [rows] = await db.execute(query, [userId]);
         // Pastikan 'points' dan 'points_earned' ada dan tidak null
         return rows.map(row => ({
             ...row,
             score: row.score ?? 0,
             points_earned: row.points_earned ?? 0,
             points: row.points ?? row.points_earned ?? 0 // Ambil dari history, fallback ke submission, fallback ke 0
         }));
    } catch (error) {
        console.error(`Error fetching quiz history for user ${userId}:`, error);
        throw error;
    }
};


/**
 * Mengambil total poin dan informasi peringkat user. (Tidak Berubah)
 */
Point.getSummary = async (userId) => {
    const [users] = await db.execute("SELECT points FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
        console.warn(`[WARN] User not found for point summary: userId ${userId}`);
         return {
            totalPoints: 0,
            currentRank: { name: 'Murid Baru', points: 0, color: '#CD7F32', icon: 'bronze' },
            nextRank: { name: 'Siswa Rajin', points: 5000, color: '#C0C0C0', icon: 'silver' }
        };
    }
    const currentUserPoints = users[0].points || 0;

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