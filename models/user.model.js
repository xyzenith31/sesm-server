// contoh-server-sesm/models/user.model.js
const db = require("../config/database.config.js");
const bcrypt = require('bcryptjs');

const User = {};

User.findById = async (userId) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [userId]);
    return rows[0];
};

User.create = async (newUser) => {
  const [result] = await db.execute(
    "INSERT INTO users (username, email, password, nama, umur, role) VALUES (?, ?, ?, ?, ?, ?)",
    [newUser.username, newUser.email, newUser.password, newUser.nama, newUser.umur, newUser.role || 'siswa']
  );
  return { id: result.insertId, ...newUser };
};

User.findByUsernameOrEmail = async (identifier) => {
  const [rows] = await db.execute(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [identifier, identifier]
  );
  return rows[0];
};

User.updateById = async (userId, data) => {
  const { nama, username, umur, password, avatar } = data;

  const fields = [];
  const values = [];

  // Validasi dan tambahkan field yang akan diupdate
  if (nama) { fields.push("nama = ?"); values.push(nama); }
  if (username) { fields.push("username = ?"); values.push(username); }
  
  // Pastikan umur adalah angka atau null, bukan string kosong
  if (umur !== undefined) {
    const age = umur === '' ? null : parseInt(umur, 10);
    fields.push("umur = ?");
    values.push(age);
  }

  if (avatar !== undefined) {
      if (avatar === 'DELETE') {
          fields.push("avatar = ?");
          values.push(null);
      } else {
          fields.push("avatar = ?");
          values.push(avatar);
      }
  }
  
  // Hanya update password jika diisi (tidak kosong)
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

User.saveResetToken = async (userId, hashedToken, expires) => {
    const [result] = await db.execute(
        "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
        [hashedToken, expires, userId]
    );
    return result.affectedRows;
};

User.updatePasswordAndClearToken = async (userId, hashedPassword) => {
    const [result] = await db.execute(
        "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
        [hashedPassword, userId]
    );
    return result.affectedRows;
};

User.clearResetToken = async (userId) => {
    const [result] = await db.execute(
        "UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
        [userId]
    );
    return result.affectedRows;
};

User.getLeaderboard = async () => {
    const query = `
        SELECT id, nama, username, points, avatar 
        FROM users 
        WHERE role = 'siswa'
        ORDER BY points DESC 
        LIMIT 10
    `;
    const [rows] = await db.execute(query);
    return rows;
};

module.exports = User;