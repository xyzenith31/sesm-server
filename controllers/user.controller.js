// contoh-sesm-server/controllers/user.controller.js
const User = require('../models/user.model.js');
const bcrypt = require('bcryptjs');

// === FUNGSI-FUNGSI BARU UNTUK ADMIN ===

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil daftar pengguna: " + error.message });
    }
};

exports.createUserByAdmin = async (req, res) => {
    const { username, email, nama, umur, password, role } = req.body;
    try {
        const newUser = {
            username, email, nama, umur, role,
            password: bcrypt.hashSync(password, 8)
        };
        const createdUser = await User.create(newUser);
        res.status(201).send({ message: "Pengguna baru berhasil dibuat.", data: createdUser });
    } catch (error) {
        // Handle error duplikasi
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('username')) {
                return res.status(400).send({ message: "Username sudah digunakan." });
            }
            if (error.message.includes('email')) {
                return res.status(400).send({ message: "Email sudah digunakan." });
            }
        }
        res.status(500).send({ message: "Gagal membuat pengguna baru: " + error.message });
    }
};

exports.updateUserByAdmin = async (req, res) => {
    const { userId } = req.params;
    const dataToUpdate = req.body;

    // Jika password dikirim tapi kosong, hapus dari objek agar tidak di-update
    if (dataToUpdate.password !== undefined && dataToUpdate.password.trim() === '') {
        delete dataToUpdate.password;
    }

    try {
        const result = await User.updateById(userId, dataToUpdate);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Pengguna tidak ditemukan." });
        }
        res.status(200).send({ message: "Data pengguna berhasil diperbarui." });
    } catch (error) {
        res.status(500).send({ message: "Gagal memperbarui data: " + error.message });
    }
};

exports.deleteUserByAdmin = async (req, res) => {
    const { userId } = req.params;
    try {
        const affectedRows = await User.deleteById(userId);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Pengguna tidak ditemukan." });
        }
        res.status(200).send({ message: "Pengguna berhasil dihapus." });
    } catch (error) {
        res.status(500).send({ message: "Gagal menghapus pengguna: " + error.message });
    }
};

// === FUNGSI LAMA UNTUK PROFIL PENGGUNA (TIDAK BERUBAH) ===

exports.updateUserProfile = async (req, res) => {
  const userId = req.userId;
  const dataToUpdate = { ...req.body };

  if (req.file) {
    dataToUpdate.avatar = req.file.path.replace(/\\/g, "/");
  } else if (dataToUpdate.avatar === 'DELETE') {
    dataToUpdate.avatar = 'DELETE';
  } else if (dataToUpdate.avatar) {
    // biarkan saja
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return res.status(400).send({ message: "Tidak ada data untuk diperbarui." });
  }

  try {
    const result = await User.updateById(userId, dataToUpdate);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "User tidak ditemukan." });
    }
    
    const responsePayload = { message: "Profil berhasil diperbarui." };
    if (dataToUpdate.avatar && dataToUpdate.avatar !== 'DELETE') {
        responsePayload.avatar = dataToUpdate.avatar;
    } else if (dataToUpdate.avatar === 'DELETE') {
        responsePayload.avatar = null;
    }
    
    res.status(200).send(responsePayload);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updateLevelAndClass = async (req, res) => {
  const userId = req.userId; 
  const { jenjang, kelas } = req.body;

  try {
    const result = await User.updateProfile(userId, { jenjang, kelas });

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "User tidak ditemukan." });
    }
    
    res.status(200).send({ message: "Profil jenjang dan kelas berhasil diperbarui." });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const leaderboardData = await User.getLeaderboard();
        res.status(200).json(leaderboardData);
    } catch (error) {
        res.status(500).send({ message: "Gagal memuat papan peringkat: " + error.message });
    }
};