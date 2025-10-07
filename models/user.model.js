const db = require("../config/database.config.js");

const User = {};

// Fungsi untuk membuat user baru (DIUBAH)
User.create = async (newUser) => {
  // Hapus jenjang & kelas dari query INSERT
  const [result] = await db.execute(
    "INSERT INTO users (username, email, password, nama, umur) VALUES (?, ?, ?, ?, ?)",
    [newUser.username, newUser.email, newUser.password, newUser.nama, newUser.umur]
  );
  return { id: result.insertId, ...newUser };
};

// Fungsi untuk mencari user berdasarkan username atau email (TETAP SAMA)
User.findByUsernameOrEmail = async (identifier) => {
  const [rows] = await db.execute(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [identifier, identifier]
  );
  return rows[0]; // Mengembalikan user pertama yang ditemukan
};

// Fungsi baru untuk memperbarui jenjang dan kelas (DITAMBAHKAN)
User.updateProfile = async (userId, data) => {
  // COALESCE digunakan agar jika salah satu nilai tidak dikirim, nilai lama tetap dipertahankan
  const [result] = await db.execute(
    "UPDATE users SET jenjang = COALESCE(?, jenjang), kelas = COALESCE(?, kelas) WHERE id = ?",
    [data.jenjang, data.kelas, userId]
  );
  return result;
};

module.exports = User;