const User = require('../models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fungsi register tidak diubah, sudah sesuai permintaan Anda
exports.register = async (req, res) => {
  const { username, email, nama, umur, password, konfirmasi_password } = req.body;

  if (password !== konfirmasi_password) {
    return res.status(400).send({ message: "Password dan Konfirmasi Password tidak cocok." });
  }

  try {
    const newUser = {
      username,
      email,
      password: bcrypt.hashSync(password, 8),
      nama,
      umur
    };

    const createdUser = await User.create(newUser);
    res.status(201).send({ message: "User berhasil didaftarkan!", userId: createdUser.id });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Fungsi untuk Login (DIPERBARUI)
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

    // KIRIM RESPON DENGAN MENAMBAHKAN INFORMASI JENJANG DAN KELAS
    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      nama: user.nama,
      jenjang: user.jenjang, // <-- TAMBAHAN
      kelas: user.kelas,     // <-- TAMBAHAN
      accessToken: token
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};