// contoh-server-sesm/controllers/auth.controller.js
const User = require('../models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const sendResetEmail = async (userEmail, token) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });
        const mailOptions = {
            from: `"SESM App" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: 'Kode Verifikasi Reset Password Akun SESM Anda',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                    <h2 style="color: #008080;">Permintaan Reset Password</h2>
                    <p>Gunakan kode verifikasi di bawah ini untuk melanjutkan. Kode ini hanya berlaku selama 15 menit.</p>
                    <div style="background-color: #f0f0f0; margin: 20px auto; padding: 15px; border-radius: 8px; width: fit-content;">
                        <strong style="font-size: 24px; letter-spacing: 5px; color: #005a5a;">${token}</strong>
                    </div>
                    <p>Jika Anda tidak merasa meminta reset password, silakan abaikan email ini.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("NODEMAILER ERROR:", error);
        throw new Error('Gagal mengirim email.');
    }
};

exports.register = async (req, res) => {
  const { username, email, nama, umur, password, konfirmasi_password, role } = req.body;
  if (password !== konfirmasi_password) {
    return res.status(400).send({ message: "Password dan Konfirmasi Password tidak cocok." });
  }
  try {
    const newUser = { username, email, password: bcrypt.hashSync(password, 8), nama, umur, role: role || 'siswa' };
    const createdUser = await User.create(newUser);
    res.status(201).send({ message: "User berhasil didaftarkan!", userId: createdUser.id });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await User.findByUsernameOrEmail(identifier);
    if (!user) return res.status(404).send({ message: "User tidak ditemukan." });
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).send({ accessToken: null, message: "Password salah!" });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 86400 });
    res.status(200).send({ id: user.id, username: user.username, email: user.email, nama: user.nama, jenjang: user.jenjang, kelas: user.kelas, role: user.role, accessToken: token });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// --- FUNGSI LUPA PASSWORD (DIPERBARUI) ---
exports.forgotPassword = async (req, res) => {
    const { identifier } = req.body;
    try {
        const user = await User.findByUsernameOrEmail(identifier);
        if (!user) return res.status(404).send({ message: "User dengan email atau username tersebut tidak ditemukan." });
        
        // 1. Buat token mentah (raw token)
        const resetToken = crypto.randomInt(100000, 999999).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        // 2. Buat hash dari token untuk disimpan di DB
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // 3. Simpan hash token ke DB
        await User.saveResetToken(user.id, hashedToken, expires);

        // 4. Kirim token mentah (raw token) ke email pengguna
        await sendResetEmail(user.email, resetToken);
        
        res.status(200).send({ message: "Kode verifikasi telah dikirim ke email Anda." });
    } catch (error) {
        console.error("Forgot Password Controller Error:", error.message);
        res.status(500).send({ message: "Gagal mengirim email verifikasi." });
    }
};

exports.resendCode = async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).send({ message: "Email atau username dibutuhkan." });
    try {
        const user = await User.findByUsernameOrEmail(identifier);
        if (!user) return res.status(404).send({ message: "User tidak ditemukan." });

        const newResetToken = crypto.randomInt(100000, 999999).toString();
        const newExpires = new Date(Date.now() + 15 * 60 * 1000);
        const hashedToken = crypto.createHash('sha256').update(newResetToken).digest('hex');
        
        await User.saveResetToken(user.id, hashedToken, newExpires);
        await sendResetEmail(user.email, newResetToken);

        res.status(200).send({ message: "Kode verifikasi baru telah berhasil dikirim ulang." });
    } catch (error) {
        console.error("Resend Code Error:", error);
        res.status(500).send({ message: "Gagal mengirim ulang kode." });
    }
};

// --- FUNGSI VERIFIKASI KODE (DIPERBARUI TOTAL) ---
exports.verifyCode = async (req, res) => {
    const { code, identifier } = req.body;
    try {
        // 1. Cari pengguna berdasarkan email/username
        const user = await User.findByUsernameOrEmail(identifier);
        
        // 2. Cek apakah pengguna ada, punya token, dan tokennya belum kedaluwarsa
        if (!user || !user.reset_token || !user.reset_token_expires || user.reset_token_expires < new Date()) {
            return res.status(400).send({ message: "Kode verifikasi tidak valid atau sudah kedaluwarsa." });
        }

        // 3. Hash kode yang dimasukkan pengguna
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        
        // 4. Bandingkan hash dari input dengan hash yang ada di database
        if (hashedCode !== user.reset_token) {
            return res.status(400).send({ message: "Kode verifikasi salah." });
        }
        
        // Jika cocok, kirim respon sukses
        res.status(200).send({ message: "Kode berhasil diverifikasi." });

    } catch (error) {
        res.status(500).send({ message: "Terjadi kesalahan pada server." });
    }
};


// --- FUNGSI RESET PASSWORD (DIPERBARUI) ---
exports.resetPassword = async (req, res) => {
    const { code, identifier, password, konfirmasi_password } = req.body;

    if (password !== konfirmasi_password) {
        return res.status(400).send({ message: "Password dan Konfirmasi Password tidak cocok." });
    }

    try {
        const user = await User.findByUsernameOrEmail(identifier);
        if (!user || !user.reset_token || user.reset_token_expires < new Date()) {
            return res.status(400).send({ message: "Token reset tidak valid atau sudah kedaluwarsa." });
        }

        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        if (hashedCode !== user.reset_token) {
            return res.status(400).send({ message: "Token reset tidak valid." });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        await User.updatePasswordAndClearToken(user.id, hashedPassword);

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 86400 });

        res.status(200).send({
          message: "Password berhasil diubah. Anda sekarang login.",
          id: user.id,
          username: user.username,
          email: user.email,
          nama: user.nama,
          jenjang: user.jenjang,
          kelas: user.kelas,
          role: user.role,
          accessToken: token
        });

    } catch (error) {
        res.status(500).send({ message: "Gagal mengubah password." });
    }
};

// --- FUNGSI BARU: LOGIN DENGAN KODE VERIFIKASI ---
exports.loginWithCode = async (req, res) => {
    const { code, identifier } = req.body;
    try {
        const user = await User.findByUsernameOrEmail(identifier);
        if (!user || !user.reset_token || user.reset_token_expires < new Date()) {
            return res.status(400).send({ message: "Sesi tidak valid atau sudah kedaluwarsa." });
        }

        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        if (hashedCode !== user.reset_token) {
            return res.status(400).send({ message: "Sesi tidak valid." });
        }

        // Bersihkan token setelah berhasil digunakan
        await User.clearResetToken(user.id);
        
        // Logika login
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 86400 });
        res.status(200).send({
          message: "Login berhasil.",
          id: user.id,
          username: user.username,
          email: user.email,
          nama: user.nama,
          jenjang: user.jenjang,
          kelas: user.kelas,
          role: user.role,
          accessToken: token
        });

    } catch (error) {
        res.status(500).send({ message: "Gagal untuk login." });
    }
};