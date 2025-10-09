// contoh-server-sesm/models/subject.model.js
const db = require("../config/database.config.js");

const Subject = {};

// Fungsi untuk mencari mata pelajaran berdasarkan jenjang dan kelas
Subject.findByJenjangAndKelas = async (jenjang, kelas) => {
  let query = "SELECT * FROM subjects WHERE jenjang = ?";
  const params = [jenjang];

  if (jenjang.toUpperCase() === 'SD' && kelas) {
    query += " AND kelas = ?";
    params.push(kelas);
  } else {
    // Untuk TK, kelas adalah NULL
    query += " AND kelas IS NULL";
  }

  const [rows] = await db.execute(query, params);
  return rows;
};

// Fungsi untuk membuat subject baru (berguna untuk admin nanti)
Subject.create = async (subjectData) => {
    const { nama_mapel, icon, jenjang, kelas } = subjectData;
    const [result] = await db.execute(
        "INSERT INTO subjects (nama_mapel, icon, jenjang, kelas) VALUES (?, ?, ?, ?)",
        [nama_mapel, icon, jenjang, kelas || null]
    );
    return { id: result.insertId, ...subjectData };
};


module.exports = Subject;