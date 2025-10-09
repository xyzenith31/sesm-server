const User = require('../models/user.model.js');

// --- (FUNGSI BARU DITAMBAHKAN DI SINI) ---
// Fungsi untuk handle update profil umum
exports.updateUserProfile = async (req, res) => {
  const userId = req.userId; // ID didapat dari middleware verifyToken

  // Cek jika body request kosong
  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({ message: "Tidak ada data untuk diperbarui." });
  }

  try {
    // Panggil fungsi model yang baru kita buat
    const result = await User.updateById(userId, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "User tidak ditemukan." });
    }
    
    res.status(200).send({ message: "Profil berhasil diperbarui." });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};


// Fungsi lama untuk update jenjang dan kelas (tetap ada)
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