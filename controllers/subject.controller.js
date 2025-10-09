// contoh-server-sesm/controllers/subject.controller.js
const Subject = require('../models/subject.model.js');

// Fungsi controller untuk mendapatkan mata pelajaran dari DATABASE
exports.getSubjects = async (req, res) => {
  const { jenjang, kelas } = req.params;

  if (!jenjang) {
    return res.status(400).send({ message: "Parameter 'jenjang' (tk/sd) dibutuhkan." });
  }

  // Untuk jenjang SD, kelas wajib ada
  if (jenjang.toLowerCase() === 'sd' && !kelas) {
    return res.status(400).send({ message: "Parameter 'kelas' dibutuhkan untuk jenjang SD." });
  }

  try {
    const subjects = await Subject.findByJenjangAndKelas(jenjang, kelas);

    if (!subjects || subjects.length === 0) {
      const kelasInfo = kelas ? `kelas '${kelas}'` : '';
      return res.status(404).send({ message: `Mata pelajaran untuk jenjang '${jenjang}' ${kelasInfo} tidak ditemukan.` });
    }
    
    // Transformasi data agar sesuai dengan yang diharapkan frontend
    const formattedSubjects = subjects.map(s => ({
        icon: s.icon,
        label: s.nama_mapel,
        id: s.id // Kirim juga ID untuk query selanjutnya
    }));

    res.status(200).json(formattedSubjects);

  } catch (error) {
    res.status(500).send({ message: "Terjadi kesalahan di server: " + error.message });
  }
};