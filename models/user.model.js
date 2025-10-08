const db = require("../config/database.config.js");

const User = {};

// Fungsi untuk membuat user baru (DIUBAH)
User.create = async (newUser) => {
  const [result] = await db.execute(
    "INSERT INTO users (username, email, password, nama, umur) VALUES (?, ?, ?, ?, ?)",
    [newUser.username, newUser.email, newUser.password, newUser.nama, newUser.umur]
  );
  return { id: result.insertId, ...newUser };
};

// Fungsi untuk mencari user berdasarkan username atau email
User.findByUsernameOrEmail = async (identifier) => {
  const [rows] = await db.execute(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [identifier, identifier]
  );
  return rows[0];
};

// Fungsi baru untuk memperbarui jenjang dan kelas
User.updateProfile = async (userId, data) => {
  const [result] = await db.execute(
    "UPDATE users SET jenjang = COALESCE(?, jenjang), kelas = COALESCE(?, kelas) WHERE id = ?",
    [data.jenjang, data.kelas, userId]
  );
  return result;
};

module.exports = User;