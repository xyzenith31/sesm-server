// contoh-sesm-server/controllers/user.controller.js
const User = require('../models/user.model.js');

exports.updateUserProfile = async (req, res) => {
  const userId = req.userId;
  const dataToUpdate = { ...req.body };

  // Cek jika ada file yang diupload oleh middleware
  if (req.file) {
    // Simpan path file (misal: "uploads/avatar-16655723324.png") ke data yang akan di-update
    // Ganti backslash (\) dengan forward slash (/) untuk kompatibilitas URL
    dataToUpdate.avatar = req.file.path.replace(/\\/g, "/");
  } else if (dataToUpdate.avatar === 'DELETE') {
    // Jika frontend mengirim sinyal 'DELETE', kita akan set avatar ke null di model
    dataToUpdate.avatar = 'DELETE';
  } else if (dataToUpdate.avatar) {
    // Jika frontend mengirim URL avatar bawaan (dari dicebear, dll)
    // biarkan saja nilainya seperti itu.
  }


  if (Object.keys(dataToUpdate).length === 0) {
    return res.status(400).send({ message: "Tidak ada data untuk diperbarui." });
  }

  try {
    const result = await User.updateById(userId, dataToUpdate);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "User tidak ditemukan." });
    }
    
    // Kirim kembali path avatar baru jika ada
    const responsePayload = { message: "Profil berhasil diperbarui." };
    if (dataToUpdate.avatar && dataToUpdate.avatar !== 'DELETE') {
        responsePayload.avatar = dataToUpdate.avatar;
    } else if (dataToUpdate.avatar === 'DELETE') {
        responsePayload.avatar = null; // Kirim null jika avatar dihapus
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