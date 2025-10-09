// Menambahkan ID unik untuk setiap pertanyaan
const materiData = {
  pai_1: {
    judul: "Rukun Iman dan Rukun Islam",
    mapel: "Pendidikan Agama Islam",
    questions: [
      {
        id: 'q1_1', // ID unik
        type: 'multiple-choice',
        question: 'Ada berapa Rukun Iman dalam ajaran Islam?',
        options: ['Empat', 'Lima', 'Enam', 'Tujuh'],
        correctAnswer: 'Enam'
      },
      {
        id: 'q1_2',
        type: 'essay',
        question: 'Sebutkan Rukun Islam yang pertama!',
        correctAnswer: 'Syahadat'
      },
      {
        id: 'q1_3',
        type: 'multiple-choice',
        question: 'Percaya kepada Malaikat termasuk dalam rukun...',
        options: ['Islam', 'Iman', 'Sholat', 'Haji'],
        correctAnswer: 'Iman'
      },
      {
        id: 'q1_4',
        type: 'essay',
        question: 'Apa arti dari "iman"?',
        correctAnswer: 'Percaya'
      }
    ]
  },
  pai_2: {
    judul: "Kisah Nabi dan Rasul",
    mapel: "Pendidikan Agama Islam",
    questions: [
      {
        id: 'q2_1',
        type: 'multiple-choice',
        question: 'Nabi yang dikenal dengan kesabarannya saat diuji penyakit adalah...',
        options: ['Nabi Musa AS', 'Nabi Ayub AS', 'Nabi Isa AS', 'Nabi Ibrahim AS'],
        correctAnswer: 'Nabi Ayub AS'
      },
    ]
  },
  matematika_1: {
    judul: "Bilangan Sampai 10",
    mapel: "Matematika",
    questions: [
      {
        id: 'q3_1',
        type: 'multiple-choice',
        question: 'Angka setelah 7 adalah...',
        options: ['6', '8', '9', '5'],
        correctAnswer: '8'
      },
      {
        id: 'q3_2',
        type: 'multiple-choice',
        question: 'Berapa hasil dari 3 + 5?',
        options: ['7', '8', '9', '10'],
        correctAnswer: '8'
      },
    ]
  }
};

// Kita ekspor datanya agar bisa dimodifikasi di controller
module.exports = materiData;