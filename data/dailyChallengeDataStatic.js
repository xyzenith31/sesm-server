// File: contoh-sesm-server/data/dailyChallengeDataStatic.js
// INI ADALAH FILE UNTUK BACKEND (NODE.JS)

// Daftar 100 tantangan
const dailyChallengesData = [
    // === BERHITUNG (10 Soal) ===
    {
        id: 'hitung_1', iconName: 'FaCalculator', category: 'Berhitung', title: 'Hitung Jari',
        description: 'Ada berapa jari di satu tangan?', originalPoints: 0, completed: false,
        quiz: { question: "Berapa jumlah jari di satu tanganmu?", options: ["3", "4", "5", "6"], correctAnswer: "5" }
    },
    {
        id: 'hitung_2', iconName: 'FaCalculator', category: 'Berhitung', title: 'Hitung Bola',
        description: 'Hitung jumlah bola.', originalPoints: 0, completed: false,
        quiz: { question: "Ada berapa bola: ⚽⚽⚽⚽?", options: ["2", "3", "4", "5"], correctAnswer: "4" }
    },
    {
        id: 'hitung_3', iconName: 'FaCalculator', category: 'Berhitung', title: 'Angka Hilang',
        description: 'Angka berapa setelah 1?', originalPoints: 0, completed: false,
        quiz: { question: "1, ..., 3. Angka berapa yang hilang?", options: ["0", "2", "4", "5"], correctAnswer: "2" }
    },
    {
        id: 'hitung_4', iconName: 'FaCalculator', category: 'Berhitung', title: 'Tambah Sedikit',
        description: 'Berapa 1 ditambah 1?', originalPoints: 0, completed: false,
        quiz: { question: "Jika kamu punya 1 permen, lalu diberi 1 lagi, jadi berapa?", options: ["1", "2", "3", "0"], correctAnswer: "2" }
    },
    {
        id: 'hitung_5', iconName: 'FaCalculator', category: 'Berhitung', title: 'Bentuk Apa Ini?',
        description: 'Kenali bentuk geometri.', originalPoints: 0, completed: false,
        quiz: { question: "Bentuk roda sepeda adalah...", options: ["Kotak", "Segitiga", "Lingkaran", "Bintang"], correctAnswer: "Lingkaran" }
    },
    {
        id: 'hitung_6', iconName: 'FaCalculator', category: 'Berhitung', title: 'Lebih Banyak Mana?',
        description: 'Mana yang lebih banyak?', originalPoints: 0, completed: false,
        quiz: { question: "Mana yang lebih banyak, 🍎🍎🍎 atau 🍎🍎?", options: ["🍎🍎🍎", "🍎🍎", "Sama banyak", "Tidak tahu"], correctAnswer: "🍎🍎🍎" }
    },
    {
        id: 'hitung_7', iconName: 'FaCalculator', category: 'Berhitung', title: 'Hitung Mundur',
        description: 'Angka sebelum 3?', originalPoints: 0, completed: false,
        quiz: { question: "Sebutkan angka sebelum angka 3!", options: ["1", "2", "4", "5"], correctAnswer: "2" }
    },
    {
        id: 'hitung_8', iconName: 'FaCalculator', category: 'Berhitung', title: 'Kurang Sedikit',
        description: 'Berapa 2 dikurangi 1?', originalPoints: 0, completed: false,
        quiz: { question: "Kamu punya 2 kue, dimakan 1. Sisa berapa?", options: ["0", "1", "2", "3"], correctAnswer: "1" }
    },
    {
        id: 'hitung_9', iconName: 'FaCalculator', category: 'Berhitung', title: 'Jumlah Roda Mobil',
        description: 'Ada berapa roda mobil?', originalPoints: 0, completed: false,
        quiz: { question: "Mobil biasanya punya berapa roda?", options: ["2", "3", "4", "5"], correctAnswer: "4" }
    },
    {
        id: 'hitung_10', iconName: 'FaCalculator', category: 'Berhitung', title: 'Angka Nol',
        description: 'Mana angka nol?', originalPoints: 0, completed: false,
        quiz: { question: "Yang mana angka nol?", options: ["1", "0", "2", "3"], correctAnswer: "0" }
    },

    // === MEMBACA (10 Soal) ===
    {
        id: 'baca_1', iconName: 'FaBookReader', category: 'Membaca', title: 'Huruf Awal',
        description: 'Kata "Apel" dimulai huruf apa?', originalPoints: 0, completed: false,
        quiz: { question: "Huruf pertama kata 'Apel' adalah...", options: ["A", "B", "C", "D"], correctAnswer: "A" }
    },
    {
        id: 'baca_2', iconName: 'FaBookReader', category: 'Membaca', title: 'Huruf Akhir',
        description: 'Kata "Ibu" diakhiri huruf apa?', originalPoints: 0, completed: false,
        quiz: { question: "Huruf terakhir kata 'Ibu' adalah...", options: ["I", "B", "U", "A"], correctAnswer: "U" }
    },
    {
        id: 'baca_3', iconName: 'FaBookReader', category: 'Membaca', title: 'Mengenal Huruf B',
        description: 'Mana huruf B?', originalPoints: 0, completed: false,
        quiz: { question: "Yang mana huruf 'B'?", options: ["A", "B", "C", "D"], correctAnswer: "B" }
    },
    {
        id: 'baca_4', iconName: 'FaBookReader', category: 'Membaca', title: 'Mengenal Huruf Vokal',
        description: 'Mana yang huruf vokal?', originalPoints: 0, completed: false,
        quiz: { question: "Pilih yang termasuk huruf vokal (hidup).", options: ["B", "C", "D", "E"], correctAnswer: "E" }
    },
    {
        id: 'baca_5', iconName: 'FaBookReader', category: 'Membaca', title: 'Membaca Kata Sederhana',
        description: 'Baca kata: BUKU', originalPoints: 0, completed: false,
        quiz: { question: "Kata ini dibaca...", options: ["BABI", "BUDI", "BUKU", "BULA"], correctAnswer: "BUKU" }
    },
    {
        id: 'baca_6', iconName: 'FaBookReader', category: 'Membaca', title: 'Mengenal Huruf Kecil',
        description: 'Mana huruf "a" kecil?', originalPoints: 0, completed: false,
        quiz: { question: "Yang mana huruf 'a' kecil?", options: ["A", "b", "a", "D"], correctAnswer: "a" }
    },
    {
        id: 'baca_7', iconName: 'FaBookReader', category: 'Membaca', title: 'Mengenal Huruf Besar',
        description: 'Mana huruf "C" besar?', originalPoints: 0, completed: false,
        quiz: { question: "Yang mana huruf 'C' besar?", options: ["c", "B", "C", "d"], correctAnswer: "C" }
    },
    {
        id: 'baca_8', iconName: 'FaBookReader', category: 'Membaca', title: 'Jumlah Huruf',
        description: 'Ada berapa huruf di kata "MEJA"?', originalPoints: 0, completed: false,
        quiz: { question: "Hitung jumlah huruf pada kata 'MEJA'.", options: ["2", "3", "4", "5"], correctAnswer: "4" }
    },
    {
        id: 'baca_9', iconName: 'FaBookReader', category: 'Membaca', title: 'Benda di Kelas',
        description: 'Mana tulisan "Kursi"?', originalPoints: 0, completed: false,
        quiz: { question: "Yang mana tulisan untuk gambar kursi?", options: ["Meja", "Papan", "Kursi", "Buku"], correctAnswer: "Kursi" }
    },
    {
        id: 'baca_10', iconName: 'FaBookReader', category: 'Membaca', title: 'Huruf Konsonan',
        description: 'Mana yang huruf konsonan?', originalPoints: 0, completed: false,
        quiz: { question: "Pilih yang termasuk huruf konsonan (mati).", options: ["A", "I", "K", "U"], correctAnswer: "K" }
    },

    // === MENULIS (10 Soal) ===
    {
        id: 'tulis_1', iconName: 'FaPencilAlt', category: 'Menulis', title: 'Tulis Huruf A',
        description: 'Coba tulis huruf A besar.', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },
    {
        id: 'tulis_2', iconName: 'FaPencilAlt', category: 'Menulis', title: 'Tulis Angka 1',
        description: 'Coba tulis angka 1.', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },
    {
        id: 'tulis_3', iconName: 'FaPencilAlt', category: 'Menulis', title: 'Tebalkan Garis',
        description: 'Ikuti garis putus-putus.', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },
    {
        id: 'tulis_4', iconName: 'FaPencilAlt', category: 'Menulis', title: 'Menyalin Kata',
        description: 'Salin kata "IBU".', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },
    {
        id: 'tulis_5', iconName: 'FaPencilAlt', category: 'Menulis', title: 'Gambar Lingkaran',
        description: 'Coba gambar bentuk lingkaran.', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },
    {
        id: 'tulis_6', iconName: 'FaPencilAlt', category: 'Menulis', title: 'Huruf Pertama Namamu?',
        description: 'Apa huruf pertama namamu?', originalPoints: 0, completed: false,
        quiz: { question: "Tulis huruf pertama namamu (contoh: B)", options: ["A", "B", "C", "Lainnya"], correctAnswer: "Lainnya" }
    },
    {
        id: 'tulis_7', iconName: 'FaPencilAlt', category: 'Menulis', title: 'Tulis Angka 5',
        description: 'Coba tulis angka 5.', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },
     {
        id: 'tulis_8', iconName: 'FaPencilAlt', category: 'Menulis', title: 'Tulis Huruf B',
        description: 'Coba tulis huruf B kecil.', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },
     {
        id: 'tulis_9', iconName: 'FaPencilAlt', category: 'Menulis', title: 'Gambar Kotak',
        description: 'Coba gambar bentuk kotak.', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },
     {
        id: 'tulis_10', iconName: 'FaPencilAlt', category: 'Menulis', title: 'Salin Angka 123',
        description: 'Salin angka 123.', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },

    // === AGAMA ISLAM (10 Soal) ===
    {
        id: 'pai_1', iconName: 'FaMosque', category: 'Agama Islam', title: 'Rukun Islam Pertama',
        description: 'Sebutkan Rukun Islam pertama.', originalPoints: 0, completed: false,
        quiz: { question: "Rukun Islam yang pertama adalah?", options: ["Sholat", "Puasa", "Syahadat", "Zakat"], correctAnswer: "Syahadat" }
    },
    {
        id: 'pai_2', iconName: 'FaMosque', category: 'Agama Islam', title: 'Jumlah Rukun Iman',
        description: 'Ada berapa Rukun Iman?', originalPoints: 0, completed: false,
        quiz: { question: "Berapa jumlah Rukun Iman?", options: ["4", "5", "6", "7"], correctAnswer: "6" }
    },
    {
        id: 'pai_3', iconName: 'FaMosque', category: 'Agama Islam', title: 'Mengucap Salam',
        description: 'Ucapan saat bertemu teman.', originalPoints: 0, completed: false,
        quiz: { question: "Apa yang kita ucapkan saat bertemu teman muslim?", options: ["Halo", "Hai", "Assalamualaikum", "Selamat Pagi"], correctAnswer: "Assalamualaikum" }
    },
    {
        id: 'pai_4', iconName: 'FaMosque', category: 'Agama Islam', title: 'Sebelum Makan',
        description: 'Apa yang dibaca sebelum makan?', originalPoints: 0, completed: false,
        quiz: { question: "Sebelum makan kita membaca...", options: ["Bismillah", "Alhamdulillah", "Subhanallah", "Allahu Akbar"], correctAnswer: "Bismillah" }
    },
    {
        id: 'pai_5', iconName: 'FaMosque', category: 'Agama Islam', title: 'Nama Nabi Terakhir',
        description: 'Siapa nama Nabi terakhir?', originalPoints: 0, completed: false,
        quiz: { question: "Siapakah Nabi dan Rasul terakhir?", options: ["Nabi Isa AS", "Nabi Musa AS", "Nabi Muhammad SAW", "Nabi Adam AS"], correctAnswer: "Nabi Muhammad SAW" }
    },
    {
        id: 'pai_6', iconName: 'FaMosque', category: 'Agama Islam', title: 'Nama Allah',
        description: 'Siapa Tuhan kita?', originalPoints: 0, completed: false,
        quiz: { question: "Siapakah Tuhan yang kita sembah?", options: ["Malaikat", "Nabi", "Allah SWT", "Manusia"], correctAnswer: "Allah SWT" }
    },
    {
        id: 'pai_7', iconName: 'FaMosque', category: 'Agama Islam', title: 'Sholat Wajib',
        description: 'Berapa kali sholat wajib sehari?', originalPoints: 0, completed: false,
        quiz: { question: "Berapa kali kita sholat wajib dalam sehari?", options: ["3 kali", "4 kali", "5 kali", "6 kali"], correctAnswer: "5 kali" }
    },
    {
        id: 'pai_8', iconName: 'FaMosque', category: 'Agama Islam', title: 'Al-Fatihah',
        description: 'Surat pertama Al-Quran.', originalPoints: 0, completed: false,
        quiz: { question: "Surat pembuka dalam Al-Quran adalah...", options: ["Al-Ikhlas", "An-Nas", "Al-Fatihah", "Al-Falaq"], correctAnswer: "Al-Fatihah" }
    },
    {
        id: 'pai_9', iconName: 'FaMosque', category: 'Agama Islam', title: 'Puasa di Bulan?',
        description: 'Bulan apa kita berpuasa?', originalPoints: 0, completed: false,
        quiz: { question: "Umat Islam berpuasa wajib di bulan...", options: ["Syawal", "Ramadhan", "Dzulhijjah", "Muharram"], correctAnswer: "Ramadhan" }
    },
    {
        id: 'pai_10', iconName: 'FaMosque', category: 'Agama Islam', title: 'Berbuat Baik',
        description: 'Bagaimana sikap kepada orang tua?', originalPoints: 0, completed: false,
        quiz: { question: "Kita harus ... kepada orang tua.", options: ["Marah", "Hormat", "Membantah", "Cuek"], correctAnswer: "Hormat" }
    },

    // === BAHASA INDONESIA (10 Soal) ===
    {
        id: 'bindo_1', iconName: 'FaBook', category: 'B. Indonesia', title: 'Warna Dasar',
        description: 'Apa warna matahari?', originalPoints: 0, completed: false,
        quiz: { question: "Matahari biasanya berwarna...", options: ["Biru", "Hijau", "Kuning", "Ungu"], correctAnswer: "Kuning" }
    },
    {
        id: 'bindo_2', iconName: 'FaBook', category: 'B. Indonesia', title: 'Nama Hewan',
        description: 'Hewan apa yang mengeong?', originalPoints: 0, completed: false,
        quiz: { question: "Hewan yang bunyinya 'meong' adalah...", options: ["Anjing", "Kucing", "Ayam", "Sapi"], correctAnswer: "Kucing" }
    },
    {
        id: 'bindo_3', iconName: 'FaBook', category: 'B. Indonesia', title: 'Anggota Tubuh',
        description: 'Apa nama bagian tubuh untuk melihat?', originalPoints: 0, completed: false,
        quiz: { question: "Kita melihat menggunakan...", options: ["Telinga", "Hidung", "Mata", "Mulut"], correctAnswer: "Mata" }
    },
    {
        id: 'bindo_4', iconName: 'FaBook', category: 'B. Indonesia', title: 'Lawan Kata',
        description: 'Apa lawan kata "Besar"?', originalPoints: 0, completed: false,
        quiz: { question: "Lawan kata dari 'Besar' adalah...", options: ["Panjang", "Pendek", "Kecil", "Tinggi"], correctAnswer: "Kecil" }
    },
    {
        id: 'bindo_5', iconName: 'FaBook', category: 'B. Indonesia', title: 'Nama Buah',
        description: 'Buah apa yang berwarna merah?', originalPoints: 0, completed: false,
        quiz: { question: "Manakah buah yang sering berwarna merah?", options: ["Pisang", "Mangga", "Apel", "Jeruk"], correctAnswer: "Apel" }
    },
    {
        id: 'bindo_6', iconName: 'FaBook', category: 'B. Indonesia', title: 'Sapaan Pagi',
        description: 'Ucapan di pagi hari.', originalPoints: 0, completed: false,
        quiz: { question: "Saat pagi hari, kita mengucapkan...", options: ["Selamat Siang", "Selamat Sore", "Selamat Malam", "Selamat Pagi"], correctAnswer: "Selamat Pagi" }
    },
    {
        id: 'bindo_7', iconName: 'FaBook', category: 'B. Indonesia', title: 'Tempat Tinggal',
        description: 'Dimana kita tinggal?', originalPoints: 0, completed: false,
        quiz: { question: "Tempat kita tidur dan tinggal disebut...", options: ["Sekolah", "Pasar", "Rumah", "Kantor"], correctAnswer: "Rumah" }
    },
    {
        id: 'bindo_8', iconName: 'FaBook', category: 'B. Indonesia', title: 'Kendaraan',
        description: 'Kendaraan roda dua.', originalPoints: 0, completed: false,
        quiz: { question: "Kendaraan yang punya dua roda adalah...", options: ["Mobil", "Bus", "Sepeda Motor", "Kereta"], correctAnswer: "Sepeda Motor" }
    },
    {
        id: 'bindo_9', iconName: 'FaBook', category: 'B. Indonesia', title: 'Profesi',
        description: 'Siapa yang mengajar di sekolah?', originalPoints: 0, completed: false,
        quiz: { question: "Orang yang mengajar murid di sekolah adalah...", options: ["Dokter", "Polisi", "Guru", "Petani"], correctAnswer: "Guru" }
    },
    {
        id: 'bindo_10', iconName: 'FaBook', category: 'B. Indonesia', title: 'Rasa Makanan',
        description: 'Bagaimana rasa gula?', originalPoints: 0, completed: false,
        quiz: { question: "Gula rasanya...", options: ["Asin", "Pahit", "Asam", "Manis"], correctAnswer: "Manis" }
    },

    // === BAHASA INGGRIS (10 Soal) ===
    {
        id: 'bing_1', iconName: 'FaLanguage', category: 'B. Inggris', title: 'Cat',
        description: 'Bahasa Inggris kucing.', originalPoints: 0, completed: false,
        quiz: { question: "What is 'kucing' in English?", options: ["Dog", "Cat", "Bird", "Fish"], correctAnswer: "Cat" }
    },
    {
        id: 'bing_2', iconName: 'FaLanguage', category: 'B. Inggris', title: 'Apple',
        description: 'Bahasa Inggris apel.', originalPoints: 0, completed: false,
        quiz: { question: "What is 'apel' in English?", options: ["Banana", "Orange", "Apple", "Grape"], correctAnswer: "Apple" }
    },
    {
        id: 'bing_3', iconName: 'FaLanguage', category: 'B. Inggris', title: 'Number One',
        description: 'Angka satu bahasa Inggris.', originalPoints: 0, completed: false,
        quiz: { question: "How to say 'satu' in English?", options: ["One", "Two", "Three", "Four"], correctAnswer: "One" }
    },
    {
        id: 'bing_4', iconName: 'FaLanguage', category: 'B. Inggris', title: 'Color Red',
        description: 'Warna merah bahasa Inggris.', originalPoints: 0, completed: false,
        quiz: { question: "What is the English word for 'merah'?", options: ["Blue", "Green", "Yellow", "Red"], correctAnswer: "Red" }
    },
    {
        id: 'bing_5', iconName: 'FaLanguage', category: 'B. Inggris', title: 'Hello',
        description: 'Sapaan Hello.', originalPoints: 0, completed: false,
        quiz: { question: "If you meet someone, you can say...", options: ["Goodbye", "Thank You", "Hello", "Sorry"], correctAnswer: "Hello" }
    },
    {
        id: 'bing_6', iconName: 'FaLanguage', category: 'B. Inggris', title: 'Book',
        description: 'Bahasa Inggris buku.', originalPoints: 0, completed: false,
        quiz: { question: "What is 'buku' in English?", options: ["Pen", "Pencil", "Book", "Table"], correctAnswer: "Book" }
    },
    {
        id: 'bing_7', iconName: 'FaLanguage', category: 'B. Inggris', title: 'Number Two',
        description: 'Angka dua bahasa Inggris.', originalPoints: 0, completed: false,
        quiz: { question: "How to say 'dua' in English?", options: ["One", "Two", "Three", "Four"], correctAnswer: "Two" }
    },
    {
        id: 'bing_8', iconName: 'FaLanguage', category: 'B. Inggris', title: 'Color Blue',
        description: 'Warna biru bahasa Inggris.', originalPoints: 0, completed: false,
        quiz: { question: "What is the English word for 'biru'?", options: ["Red", "Green", "Blue", "Yellow"], correctAnswer: "Blue" }
    },
    {
        id: 'bing_9', iconName: 'FaLanguage', category: 'B. Inggris', title: 'Dog',
        description: 'Bahasa Inggris anjing.', originalPoints: 0, completed: false,
        quiz: { question: "What is 'anjing' in English?", options: ["Cat", "Dog", "Fish", "Bird"], correctAnswer: "Dog" }
    },
    {
        id: 'bing_10', iconName: 'FaLanguage', category: 'B. Inggris', title: 'Thank You',
        description: 'Ucapan terima kasih.', originalPoints: 0, completed: false,
        quiz: { question: "What do you say after receiving help?", options: ["Hello", "Goodbye", "Thank You", "Sorry"], correctAnswer: "Thank You" }
    },

    // === PKN (10 Soal) ===
    {
        id: 'pkn_1', iconName: 'FaBalanceScale', category: 'PKN', title: 'Bendera Indonesia',
        description: 'Warna bendera kita.', originalPoints: 0, completed: false,
        quiz: { question: "Apa warna bendera negara Indonesia?", options: ["Merah Putih", "Putih Merah", "Biru Putih", "Hijau Kuning"], correctAnswer: "Merah Putih" }
    },
    {
        id: 'pkn_2', iconName: 'FaBalanceScale', category: 'PKN', title: 'Lambang Negara',
        description: 'Apa lambang negara kita?', originalPoints: 0, completed: false,
        quiz: { question: "Lambang negara Indonesia adalah burung...", options: ["Elang", "Pipit", "Garuda", "Merpati"], correctAnswer: "Garuda" }
    },
    {
        id: 'pkn_3', iconName: 'FaBalanceScale', category: 'PKN', title: 'Ibukota Negara',
        description: 'Dimana ibukota Indonesia?', originalPoints: 0, completed: false,
        quiz: { question: "Apa nama ibukota negara Indonesia?", options: ["Surabaya", "Bandung", "Jakarta", "Medan"], correctAnswer: "Jakarta" }
    },
    {
        id: 'pkn_4', iconName: 'FaBalanceScale', category: 'PKN', title: 'Sopan Santun',
        description: 'Bersikap sopan.', originalPoints: 0, completed: false,
        quiz: { question: "Berbicara kepada guru harus dengan...", options: ["Keras", "Sopan", "Teriak", "Cemberut"], correctAnswer: "Sopan" }
    },
    {
        id: 'pkn_5', iconName: 'FaBalanceScale', category: 'PKN', title: 'Menghargai Teman',
        description: 'Sikap terhadap teman.', originalPoints: 0, completed: false,
        quiz: { question: "Jika teman berbeda pendapat, kita harus...", options: ["Mengejek", "Menghargai", "Memarahi", "Menjauhi"], correctAnswer: "Menghargai" }
    },
    {
        id: 'pkn_6', iconName: 'FaBalanceScale', category: 'PKN', title: 'Lagu Kebangsaan',
        description: 'Judul lagu kebangsaan.', originalPoints: 0, completed: false,
        quiz: { question: "Lagu kebangsaan Indonesia adalah...", options: ["Maju Tak Gentar", "Indonesia Raya", "Garuda Pancasila", "Hari Merdeka"], correctAnswer: "Indonesia Raya" }
    },
    {
        id: 'pkn_7', iconName: 'FaBalanceScale', category: 'PKN', title: 'Sila Pertama',
        description: 'Bunyi sila pertama Pancasila.', originalPoints: 0, completed: false,
        quiz: { question: "Sila pertama Pancasila berbunyi...", options: ["Kemanusiaan yang Adil dan Beradab", "Persatuan Indonesia", "Ketuhanan Yang Maha Esa", "Kerakyatan yang Dipimpin..."], correctAnswer: "Ketuhanan Yang Maha Esa" }
    },
    {
        id: 'pkn_8', iconName: 'FaBalanceScale', category: 'PKN', title: 'Gotong Royong',
        description: 'Kerja sama.', originalPoints: 0, completed: false,
        quiz: { question: "Membersihkan kelas bersama-sama disebut...", options: ["Belajar", "Bermain", "Gotong Royong", "Makan"], correctAnswer: "Gotong Royong" }
    },
    {
        id: 'pkn_9', iconName: 'FaBalanceScale', category: 'PKN', title: 'Presiden Indonesia',
        description: 'Siapa presiden kita?', originalPoints: 0, completed: false,
        quiz: { question: "Siapa nama Presiden Indonesia saat ini?", options: ["Susilo Bambang Yudhoyono", "Megawati Soekarnoputri", "Joko Widodo", "Prabowo Subianto"], correctAnswer: "Joko Widodo" }
    },
    {
        id: 'pkn_10', iconName: 'FaBalanceScale', category: 'PKN', title: 'Hari Kemerdekaan',
        description: 'Tanggal kemerdekaan Indonesia.', originalPoints: 0, completed: false,
        quiz: { question: "Indonesia merdeka pada tanggal...", options: ["1 Juni", "17 Agustus", "2 Mei", "28 Oktober"], correctAnswer: "17 Agustus" }
    },

    // === IPA (10 Soal) ===
    {
        id: 'ipa_1', iconName: 'FaFlask', category: 'IPA', title: 'Makhluk Hidup',
        description: 'Mana yang makhluk hidup?', originalPoints: 0, completed: false,
        quiz: { question: "Berikut ini yang termasuk makhluk hidup adalah...", options: ["Batu", "Meja", "Pohon", "Air"], correctAnswer: "Pohon" }
    },
    {
        id: 'ipa_2', iconName: 'FaFlask', category: 'IPA', title: 'Bagian Tumbuhan',
        description: 'Bagian tumbuhan di tanah.', originalPoints: 0, completed: false,
        quiz: { question: "Bagian tumbuhan yang ada di dalam tanah adalah...", options: ["Daun", "Bunga", "Batang", "Akar"], correctAnswer: "Akar" }
    },
    {
        id: 'ipa_3', iconName: 'FaFlask', category: 'IPA', title: 'Sumber Cahaya',
        description: 'Sumber cahaya terbesar.', originalPoints: 0, completed: false,
        quiz: { question: "Sumber cahaya terbesar di siang hari adalah...", options: ["Lampu", "Bulan", "Bintang", "Matahari"], correctAnswer: "Matahari" }
    },
    {
        id: 'ipa_4', iconName: 'FaFlask', category: 'IPA', title: 'Fungsi Hidung',
        description: 'Apa gunanya hidung?', originalPoints: 0, completed: false,
        quiz: { question: "Hidung berguna untuk...", options: ["Melihat", "Mencium bau", "Mendengar", "Berbicara"], correctAnswer: "Mencium bau" }
    },
    {
        id: 'ipa_5', iconName: 'FaFlask', category: 'IPA', title: 'Air',
        description: 'Kegunaan air.', originalPoints: 0, completed: false,
        quiz: { question: "Air kita gunakan untuk...", options: ["Minum dan Mandi", "Terbang", "Membaca", "Tidur"], correctAnswer: "Minum dan Mandi" }
    },
    {
        id: 'ipa_6', iconName: 'FaFlask', category: 'IPA', title: 'Siang dan Malam',
        description: 'Apa yang terlihat di malam hari?', originalPoints: 0, completed: false,
        quiz: { question: "Benda langit yang terlihat terang di malam hari adalah...", options: ["Matahari", "Awan", "Bulan", "Pelangi"], correctAnswer: "Bulan" }
    },
    {
        id: 'ipa_7', iconName: 'FaFlask', category: 'IPA', title: 'Hewan Bertelur',
        description: 'Mana hewan yang bertelur?', originalPoints: 0, completed: false,
        quiz: { question: "Hewan berikut yang berkembang biak dengan cara bertelur adalah...", options: ["Kucing", "Ayam", "Sapi", "Anjing"], correctAnswer: "Ayam" }
    },
    {
        id: 'ipa_8', iconName: 'FaFlask', category: 'IPA', title: 'Makanan Sehat',
        description: 'Mana makanan sehat?', originalPoints: 0, completed: false,
        quiz: { question: "Contoh makanan sehat adalah...", options: ["Permen", "Sayur", "Keripik", "Es Krim"], correctAnswer: "Sayur" }
    },
    {
        id: 'ipa_9', iconName: 'FaFlask', category: 'IPA', title: 'Fungsi Telinga',
        description: 'Apa gunanya telinga?', originalPoints: 0, completed: false,
        quiz: { question: "Telinga berguna untuk...", options: ["Melihat", "Mencium bau", "Mendengar", "Berbicara"], correctAnswer: "Mendengar" }
    },
    {
        id: 'ipa_10', iconName: 'FaFlask', category: 'IPA', title: 'Benda Padat',
        description: 'Mana benda padat?', originalPoints: 0, completed: false,
        quiz: { question: "Berikut ini yang merupakan benda padat adalah...", options: ["Air", "Buku", "Udara", "Asap"], correctAnswer: "Buku" }
    },

    // === IPS (10 Soal) ===
    {
        id: 'ips_1', iconName: 'FaGlobeAmericas', category: 'IPS', title: 'Keluarga Inti',
        description: 'Siapa saja keluarga inti?', originalPoints: 0, completed: false,
        quiz: { question: "Keluarga inti biasanya terdiri dari Ayah, Ibu, dan...", options: ["Kakek", "Nenek", "Paman", "Anak"], correctAnswer: "Anak" }
    },
    {
        id: 'ips_2', iconName: 'FaGlobeAmericas', category: 'IPS', title: 'Tempat Ibadah',
        description: 'Tempat ibadah umat Islam.', originalPoints: 0, completed: false,
        quiz: { question: "Umat Islam beribadah di...", options: ["Gereja", "Pura", "Vihara", "Masjid"], correctAnswer: "Masjid" }
    },
    {
        id: 'ips_3', iconName: 'FaGlobeAmericas', category: 'IPS', title: 'Rumah',
        description: 'Fungsi rumah.', originalPoints: 0, completed: false,
        quiz: { question: "Rumah berguna untuk tempat...", options: ["Bermain saja", "Belajar saja", "Tinggal dan berlindung", "Makan saja"], correctAnswer: "Tinggal dan berlindung" }
    },
    {
        id: 'ips_4', iconName: 'FaGlobeAmericas', category: 'IPS', title: 'Sekolah',
        description: 'Tempat belajar.', originalPoints: 0, completed: false,
        quiz: { question: "Tempat kita belajar bersama guru dan teman adalah...", options: ["Rumah", "Sekolah", "Pasar", "Taman"], correctAnswer: "Sekolah" }
    },
    {
        id: 'ips_5', iconName: 'FaGlobeAmericas', category: 'IPS', title: 'Tetangga',
        description: 'Orang yang tinggal dekat rumah.', originalPoints: 0, completed: false,
        quiz: { question: "Orang yang rumahnya dekat dengan rumah kita disebut...", options: ["Guru", "Teman", "Tetangga", "Saudara"], correctAnswer: "Tetangga" }
    },
    {
        id: 'ips_6', iconName: 'FaGlobeAmericas', category: 'IPS', title: 'Nama Pulau',
        description: 'Pulau tempat kita tinggal (contoh).', originalPoints: 0, completed: false,
        quiz: { question: "Pulau terbesar di Indonesia adalah...", options: ["Jawa", "Sumatra", "Kalimantan", "Papua"], correctAnswer: "Kalimantan" }
    },
    {
        id: 'ips_7', iconName: 'FaGlobeAmericas', category: 'IPS', title: 'Pakaian Adat',
        description: 'Contoh pakaian adat.', originalPoints: 0, completed: false,
        quiz: { question: "Baju kebaya adalah pakaian adat dari daerah...", options: ["Papua", "Jawa", "Sumatra", "Kalimantan"], correctAnswer: "Jawa" }
    },
    {
        id: 'ips_8', iconName: 'FaGlobeAmericas', category: 'IPS', title: 'Pasar',
        description: 'Tempat membeli sayur.', originalPoints: 0, completed: false,
        quiz: { question: "Ibu membeli sayur dan buah di...", options: ["Sekolah", "Rumah Sakit", "Pasar", "Kantor Pos"], correctAnswer: "Pasar" }
    },
    {
        id: 'ips_9', iconName: 'FaGlobeAmericas', category: 'IPS', title: 'Nama Ayah Ibu',
        description: 'Panggilan orang tua.', originalPoints: 0, completed: false,
        quiz: { question: "Orang tua laki-laki kita panggil...", options: ["Ibu", "Ayah", "Kakak", "Adik"], correctAnswer: "Ayah" }
    },
    {
        id: 'ips_10', iconName: 'FaGlobeAmericas', category: 'IPS', title: 'Aturan di Rumah',
        description: 'Contoh aturan di rumah.', originalPoints: 0, completed: false,
        quiz: { question: "Contoh aturan saat di rumah adalah...", options: ["Membuang sampah sembarangan", "Tidur larut malam", "Merapikan mainan", "Makan sambil berlari"], correctAnswer: "Merapikan mainan" }
    },

    // === KREATIF / UMUM (10 Soal) ===
    {
        id: 'umum_1', iconName: 'FaPalette', category: 'Kreatif', title: 'Warna Pelangi',
        description: 'Warna pertama pelangi?', originalPoints: 0, completed: false,
        quiz: { question: "Warna paling atas pada pelangi adalah...", options: ["Biru", "Kuning", "Merah", "Ungu"], correctAnswer: "Merah" }
    },
    {
        id: 'umum_2', iconName: 'FaQuestionCircle', category: 'Umum', title: 'Suara Hewan',
        description: 'Suara ayam jantan.', originalPoints: 0, completed: false,
        quiz: { question: "Bagaimana suara ayam jantan di pagi hari?", options: ["Meong", "Guk Guk", "Kukuruyuk", "Moo"], correctAnswer: "Kukuruyuk" }
    },
    {
        id: 'umum_3', iconName: 'FaPalette', category: 'Kreatif', title: 'Mencampur Warna',
        description: 'Merah campur kuning?', originalPoints: 0, completed: false,
        quiz: { question: "Jika warna merah dicampur dengan kuning akan menjadi warna...", options: ["Hijau", "Ungu", "Oranye", "Coklat"], correctAnswer: "Oranye" }
    },
    {
        id: 'umum_4', iconName: 'FaQuestionCircle', category: 'Umum', title: 'Alat Musik',
        description: 'Alat musik yang dipukul.', originalPoints: 0, completed: false,
        quiz: { question: "Alat musik yang cara memainkannya dipukul adalah...", options: ["Gitar", "Piano", "Drum", "Seruling"], correctAnswer: "Drum" }
    },
    {
        id: 'umum_5', iconName: 'FaPalette', category: 'Kreatif', title: 'Menggambar Bebas',
        description: 'Gambar apa saja yang kamu suka!', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },
    {
        id: 'umum_6', iconName: 'FaQuestionCircle', category: 'Umum', title: 'Nama Hari',
        description: 'Hari setelah Senin.', originalPoints: 0, completed: false,
        quiz: { question: "Setelah hari Senin adalah hari...", options: ["Minggu", "Selasa", "Rabu", "Kamis"], correctAnswer: "Selasa" }
    },
    {
        id: 'umum_7', iconName: 'FaPalette', category: 'Kreatif', title: 'Bernyanyi',
        description: 'Nyanyikan lagu Balonku!', originalPoints: 0, completed: false, quiz: null, type: 'manual_check'
    },
    {
        id: 'umum_8', iconName: 'FaQuestionCircle', category: 'Umum', title: 'Indra Pengecap',
        description: 'Bagian tubuh untuk merasa.', originalPoints: 0, completed: false,
        quiz: { question: "Kita merasakan manis, asin, asam menggunakan...", options: ["Mata", "Telinga", "Hidung", "Lidah"], correctAnswer: "Lidah" }
    },
    {
        id: 'umum_9', iconName: 'FaPalette', category: 'Kreatif', title: 'Bentuk dari Benda',
        description: 'Bentuk jam dinding?', originalPoints: 0, completed: false,
        quiz: { question: "Jam dinding di rumahmu biasanya berbentuk apa?", options: ["Lingkaran", "Kotak", "Segitiga", "Tidak Tahu"], correctAnswer: "Lingkaran" }
    },
    {
        id: 'umum_10', iconName: 'FaQuestionCircle', category: 'Umum', title: 'Lawan Arah',
        description: 'Lawan arah Kanan.', originalPoints: 0, completed: false,
        quiz: { question: "Lawan arah dari 'Kanan' adalah...", options: ["Atas", "Bawah", "Depan", "Kiri"], correctAnswer: "Kiri" }
    },
];

// Ekspor data menggunakan CommonJS (module.exports)
module.exports = {
    dailyChallengesData
};