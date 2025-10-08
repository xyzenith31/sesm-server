const allSubjects = {
  tk: [
    { icon: 'FaBookReader', label: 'Membaca' },
    { icon: 'FaPencilAlt', label: 'Menulis' },
    { icon: 'FaCalculator', label: 'Berhitung' },
    { icon: 'FaLanguage', label: 'B.Inggris' },
    { icon: 'FaBullseye', label: 'Melatih Fokus' },
    { icon: 'FaQuestionCircle', label: 'Quiziz' },
  ],
  sd_1: [
    { icon: 'FaMosque', label: 'Pendidikan Agama Islam' },
    { icon: 'FaBook', label: 'Bahasa Indonesia' },
    { icon: 'FaCalculator', label: 'Matematika' },
    { icon: 'FaLanguage', label: 'Bahasa Inggris' },
    { icon: 'FaBalanceScale', label: 'PKN' },
  ],
  sd_2: [
    { icon: 'FaMosque', label: 'Pendidikan Agama Islam' },
    { icon: 'FaBalanceScale', label: 'PKN' },
    { icon: 'FaBook', label: 'Bahasa Indonesia' },
    { icon: 'FaCalculator', label: 'Matematika' },
    { icon: 'FaLanguage', label: 'Bahasa Inggris' },
  ],
  sd_3_4: [
    { icon: 'FaMosque', label: 'Pendidikan Agama Islam' },
    { icon: 'FaBalanceScale', label: 'PKN' },
    { icon: 'FaBook', label: 'Bahasa Indonesia' },
    { icon: 'FaCalculator', label: 'Matematika' },
    { icon: 'FaLanguage', label: 'Bahasa Inggris' },
    { icon: 'FaFlask', label: 'IPA' },
    { icon: 'FaGlobeAmericas', label: 'IPS' },
  ],
  sd_5: [
    { icon: 'FaMosque', label: 'Pendidikan Agama Islam' },
    { icon: 'FaBalanceScale', label: 'PKN' },
    { icon: 'FaBook', label: 'Bahasa Indonesia' },
    { icon: 'FaCalculator', label: 'Matematika' },
    { icon: 'FaLanguage', label: 'Bahasa Inggris' },
    { icon: 'FaFlask', label: 'IPA' },
    { icon: 'FaGlobeAmericas', label: 'IPS' },
  ],
  sd_6: [
    { icon: 'FaMosque', label: 'Pendidikan Agama Islam' },
    { icon: 'FaBalanceScale', label: 'PKN' },
    { icon: 'FaBook', label: 'Bahasa Indonesia' },
    { icon: 'FaCalculator', label: 'Matematika' },
    { icon: 'FaLanguage', label: 'Bahasa Inggris' },
    { icon: 'FaFlask', label: 'IPA' },
    { icon: 'FaGlobeAmericas', label: 'IPS' },
  ],
};

// Fungsi controller untuk mendapatkan mata pelajaran
exports.getSubjects = (req, res) => {
  const { jenjang, kelas } = req.params;

  let subjectKey;

  if (!jenjang) {
    return res.status(400).send({ message: "Parameter 'jenjang' (tk/sd) dibutuhkan." });
  }

  const jenjangLower = jenjang.toLowerCase();

  if (jenjangLower === 'tk') {
    subjectKey = 'tk';
  } else if (jenjangLower === 'sd') {
    if (!kelas) {
      return res.status(400).send({ message: "Parameter 'kelas' dibutuhkan untuk jenjang SD." });
    }
    const kelasNum = parseInt(kelas, 10);
    if (isNaN(kelasNum)) {
        return res.status(400).send({ message: "Parameter 'kelas' harus berupa angka." });
    }

    if (kelasNum === 1) subjectKey = 'sd_1';
    else if (kelasNum === 2) subjectKey = 'sd_2';
    else if (kelasNum === 3 || kelasNum === 4) subjectKey = 'sd_3_4';
    else if (kelasNum === 5) subjectKey = 'sd_5';
    else if (kelasNum === 6) subjectKey = 'sd_6';
  }

  const subjects = allSubjects[subjectKey];

  if (!subjects) {
    const kelasInfo = kelas ? `kelas '${kelas}'` : '';
    return res.status(404).send({ message: `Mata pelajaran untuk jenjang '${jenjang}' ${kelasInfo} tidak ditemukan.` });
  }

  res.status(200).json(subjects);
};
