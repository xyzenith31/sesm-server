const User = require('../models/user.model.js');

// Fungsi untuk update jenjang dan kelas
exports.updateLevelAndClass = async (req, res) => {
  // Kita mendapatkan userId dari middleware verifyToken
  const userId = req.userId; 
  const { jenjang, kelas } = req.body;

  try {
    // Panggil model untuk update data di database
    const result = await User.updateProfile(userId, { jenjang, kelas });

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "User tidak ditemukan." });
    }
    
    res.status(200).send({ message: "Profil jenjang dan kelas berhasil diperbarui." });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};