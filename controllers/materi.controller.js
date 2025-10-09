// Impor data sebagai variabel agar bisa dimodifikasi di memori
let materiData = require('../data/materi.data.js');

// --- (UNTUK SISWA) ---
// Mendapatkan detail soal dari satu bab
exports.getMateriByKey = (req, res) => {
  const { materiKey } = req.params;
  const materi = materiData[materiKey];

  if (!materi) {
    return res.status(404).send({ message: `Materi dengan kunci '${materiKey}' tidak ditemukan.` });
  }

  res.status(200).json(materi);
};


// --- (UNTUK GURU/ADMIN) ---

// Mendapatkan daftar semua bab materi yang tersedia untuk dikelola
exports.getAllMateriForAdmin = (req, res) => {
    const materiList = Object.keys(materiData).map(key => ({
        materiKey: key,
        judul: materiData[key].judul,
        mapel: materiData[key].mapel,
        jumlahSoal: materiData[key].questions.length
    }));
    res.status(200).json(materiList);
};

// Menambahkan pertanyaan baru ke sebuah bab
exports.addQuestion = (req, res) => {
    const { materiKey } = req.params;
    const { type, question, options, correctAnswer } = req.body;

    if (!materiData[materiKey]) {
        return res.status(404).send({ message: "Materi tidak ditemukan." });
    }

    if (!type || !question || !correctAnswer || (type === 'multiple-choice' && !options)) {
        return res.status(400).send({ message: "Data pertanyaan tidak lengkap." });
    }

    const newQuestion = {
        id: `q${Date.now()}`, // Membuat ID unik sederhana
        type,
        question,
        options: type === 'multiple-choice' ? options : [],
        correctAnswer
    };

    materiData[materiKey].questions.push(newQuestion);
    console.log(`Soal baru ditambahkan ke ${materiKey}:`, newQuestion); // Log untuk debugging
    res.status(201).json(newQuestion);
};

// Mengupdate pertanyaan yang sudah ada
exports.updateQuestion = (req, res) => {
    const { materiKey, questionId } = req.params;
    const updatedData = req.body;

    if (!materiData[materiKey]) {
        return res.status(404).send({ message: "Materi tidak ditemukan." });
    }

    const questionIndex = materiData[materiKey].questions.findIndex(q => q.id === questionId);

    if (questionIndex === -1) {
        return res.status(404).send({ message: "Pertanyaan tidak ditemukan." });
    }

    materiData[materiKey].questions[questionIndex] = { 
        ...materiData[materiKey].questions[questionIndex], 
        ...updatedData 
    };
    
    console.log(`Soal ${questionId} diupdate di ${materiKey}:`, materiData[materiKey].questions[questionIndex]);
    res.status(200).json(materiData[materiKey].questions[questionIndex]);
};

// Menghapus pertanyaan dari sebuah bab
exports.deleteQuestion = (req, res) => {
    const { materiKey, questionId } = req.params;

    if (!materiData[materiKey]) {
        return res.status(404).send({ message: "Materi tidak ditemukan." });
    }

    const initialLength = materiData[materiKey].questions.length;
    materiData[materiKey].questions = materiData[materiKey].questions.filter(q => q.id !== questionId);

    if (materiData[materiKey].questions.length === initialLength) {
        return res.status(404).send({ message: "Pertanyaan tidak ditemukan untuk dihapus." });
    }
    
    console.log(`Soal ${questionId} dihapus dari ${materiKey}.`);
    res.status(200).send({ message: "Pertanyaan berhasil dihapus." });
};