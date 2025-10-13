const User = require('../models/user.model.js');

const verifyRegister = {};

// Daftar domain email yang diizinkan di backend
const allowedDomains = [
    '@gmail.com', '@yahoo.com', '@outlook.com', '@icloud.com', '@hotmail.com', 
    '@aol.com', '@protonmail.com', '@zoho.com', '@mail.com', '@gmx.com', 
    '@yandex.com', '@tutanota.com', '@me.com', '@fastmail.com', '@hushmail.com', 
    '@inbox.com', '@rocketmail.com', '@live.com', '@ovi.com', '@telkom.net', 
    '@cbn.net.id', '@indo.net.id', '@plasa.com'
];

verifyRegister.checkRegistrationInput = async (req, res, next) => {
  try {
    const { username, email } = req.body;

    // 1. Validasi Format Username di Backend
    // Hanya boleh huruf kecil, angka, dan simbol (._-), tanpa spasi.
    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).send({ message: "Gagal! Username hanya boleh menggunakan huruf kecil, angka, dan simbol (._-), tanpa spasi." });
    }

    // 2. Validasi Domain Email di Backend
    const emailDomain = email.substring(email.lastIndexOf('@'));
    if (!allowedDomains.includes(emailDomain.toLowerCase())) {
        return res.status(400).send({ message: "Gagal! Domain email tidak didukung." });
    }

    // 3. Cek Duplikasi Username
    let userByUsername = await User.findByUsernameOrEmail(username);
    if (userByUsername) {
      return res.status(400).send({ message: "Gagal! Username sudah digunakan." });
    }

    // 4. Cek Duplikasi Email
    let userByEmail = await User.findByUsernameOrEmail(email);
    if (userByEmail) {
      return res.status(400).send({ message: "Gagal! Email sudah digunakan." });
    }
    
    next();

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

module.exports = verifyRegister;