// contoh-server-sesm/controllers/auth.controller.js

const User = require('../models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fungsi register (tidak perlu diubah signifikan jika default 'siswa' sudah cukup)
exports.register = async (req, res) => {
  const { username, email, nama, umur, password, konfirmasi_password, role } = req.body;

  if (password !== konfirmasi_password) {
    return res.status(400).send({ message: "Password dan Konfirmasi Password tidak cocok." });
  }

  try {
    const newUser = {
      username,
      email,
      password: bcrypt.hashSync(password, 8),
      nama,
      umur,
      role: role || 'siswa' // Default role
    };

    const createdUser = await User.create(newUser);
    res.status(201).send({ message: "User berhasil didaftarkan!", userId: createdUser.id });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// --- FUNGSI LOGIN DIPERBAIKI DI SINI ---
exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findByUsernameOrEmail(identifier);

    if (!user) {
      return res.status(404).send({ message: "User tidak ditemukan." });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Password salah!"
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: 86400 // 24 jam
    });

    // PASTIKAN 'role' SELALU ADA DALAM RESPONS
    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      nama: user.nama,
      jenjang: user.jenjang,
      kelas: user.kelas,
      role: user.role, // <-- WAJIB ADA
      accessToken: token
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};