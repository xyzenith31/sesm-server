// contoh-server-sesm/models/user.model.js
const db = require("../config/database.config.js");
const bcrypt = require('bcryptjs');

const User = {};

// Tambahkan fungsi findById
User.findById = async (userId) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [userId]);
    return rows[0];
};

User.create = async (newUser) => {
  // Menambahkan kolom 'role' saat registrasi
  const [result] = await db.execute(
    "INSERT INTO users (username, email, password, nama, umur, role) VALUES (?, ?, ?, ?, ?, ?)",
    [newUser.username, newUser.email, newUser.password, newUser.nama, newUser.umur, newUser.role || 'siswa']
  );
  return { id: result.insertId, ...newUser };
};

User.findByUsernameOrEmail = async (identifier) => {
  // Memastikan kolom 'role' juga diambil saat login
  const [rows] = await db.execute(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [identifier, identifier]
  );
  return rows[0];
};

User.updateById = async (userId, data) => {
  const { nama, username, umur, password } = data;

  const fields = [];
  const values = [];

  if (nama !== undefined) {
    fields.push("nama = ?");
    values.push(nama);
  }
  if (username !== undefined) {
    fields.push("username = ?");
    values.push(username);
  }
  if (umur !== undefined) {
    fields.push("umur = ?");
    values.push(umur);
  }
  if (password) {
    fields.push("password = ?");
    values.push(bcrypt.hashSync(password, 8));
  }

  if (fields.length === 0) {
    return { affectedRows: 0 };
  }

  const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
  values.push(userId);

  const [result] = await db.execute(query, values);
  return result;
};


User.updateProfile = async (userId, data) => {
  const [result] = await db.execute(
    "UPDATE users SET jenjang = COALESCE(?, jenjang), kelas = COALESCE(?, kelas) WHERE id = ?",
    [data.jenjang, data.kelas, userId]
  );
  return result;
};


module.exports = User;