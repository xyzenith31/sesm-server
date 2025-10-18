// contoh-sesm-server/controllers/auth.controller.js
const User = require('../models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// --- HELPER FUNCTION (Tidak berubah) ---
const sendVerificationEmail = async (userEmail, token, type = 'login') => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });

        const subject = type === 'register' 
            ? 'Kode Aktivasi Akun SESM Anda' 
            : 'Kode Verifikasi Login Akun SESM Anda';
            
        const title = type === 'register'
            ? 'Aktivasi Akun Baru'
            : 'Verifikasi Login';

        const mailOptions = {
            from: `"SESM App" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                    <h2 style="color: #008080;">${title}</h2>
                    <p>Gunakan kode verifikasi di bawah ini untuk masuk ke akun Anda. Kode ini hanya berlaku selama 15 menit.</p>
                    <div style="background-color: #f0f0f0; margin: 20px auto; padding: 15px; border-radius: 8px; width: fit-content;">
                        <strong style="font-size: 24px; letter-spacing: 5px; color: #005a5a;">${token}</strong>
                    </div>
                    <p>Jika Anda tidak merasa melakukan tindakan ini, silakan abaikan email ini.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("NODEMAILER ERROR:", error);
        throw new Error('Gagal mengirim email.');
    }
};

const generateAndSaveToken = async (userId, userEmail, type) => {
    const rawToken = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 menit
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await User.saveResetToken(userId, hashedToken, expires);
    await sendVerificationEmail(userEmail, rawToken, type);
};


// --- CONTROLLERS (UPDATED) ---

exports.register = async (req, res) => {
    const { username, email, nama, umur, password, konfirmasi_password, role } = req.body;
    if (password !== konfirmasi_password) {
        return res.status(400).send({ message: "Password dan Konfirmasi Password tidak cocok." });
    }
    try {
        const newUser = { username, email, password: bcrypt.hashSync(password, 8), nama, umur, role: role || 'siswa' };
        const createdUser = await User.create(newUser);
        await generateAndSaveToken(createdUser.id, createdUser.email, 'register');
        res.status(201).send({ message: "User berhasil didaftarkan! Silakan cek email Anda untuk kode aktivasi." });
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
        if (!passwordIsValid) return res.status(401).send({ message: "Password salah!" });

        await generateAndSaveToken(user.id, user.email, 'login');
        res.status(200).send({ message: "Kode verifikasi telah dikirim ke email Anda." });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.verifyAndLogin = async (req, res) => {
    const { code, identifier } = req.body;
    try {
        const user = await User.findByUsernameOrEmail(identifier);
        
        if (!user || !user.reset_token || !user.reset_token_expires || user.reset_token_expires < new Date()) {
            return res.status(400).send({ message: "Kode verifikasi tidak valid atau sudah kedaluwarsa." });
        }

        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        
        if (hashedCode !== user.reset_token) {
            return res.status(400).send({ message: "Kode verifikasi salah." });
        }
        
        await User.clearResetToken(user.id);

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 86400 });
        
        // ✅ PERBAIKAN: Tambahkan field 'avatar' ke dalam response
        res.status(200).send({
            message: "Verifikasi berhasil! Anda sekarang login.",
            id: user.id,
            username: user.username,
            email: user.email,
            nama: user.nama,
            jenjang: user.jenjang,
            kelas: user.kelas,
            role: user.role,
            avatar: user.avatar, // <-- Tambahan di sini
            accessToken: token
        });

    } catch (error) {
        res.status(500).send({ message: "Terjadi kesalahan pada server." });
    }
};


// --- FUNGSI LUPA PASSWORD ---
exports.forgotPassword = async (req, res) => {
    const { identifier } = req.body;
    try {
        const user = await User.findByUsernameOrEmail(identifier);
        if (!user) return res.status(404).send({ message: "User dengan email atau username tersebut tidak ditemukan." });
        
        await generateAndSaveToken(user.id, user.email, 'reset');
        
        res.status(200).send({ message: "Kode verifikasi untuk reset password telah dikirim ke email Anda." });
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

        await generateAndSaveToken(user.id, user.email, 'resend');

        res.status(200).send({ message: "Kode verifikasi baru telah berhasil dikirim ulang." });
    } catch (error) {
        console.error("Resend Code Error:", error);
        res.status(500).send({ message: "Gagal mengirim ulang kode." });
    }
};

exports.verifyCode = async (req, res) => {
    const { code, identifier } = req.body;
    try {
        const user = await User.findByUsernameOrEmail(identifier);
        if (!user || !user.reset_token || !user.reset_token_expires || user.reset_token_expires < new Date()) {
            return res.status(400).send({ message: "Kode verifikasi tidak valid atau sudah kedaluwarsa." });
        }
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        if (hashedCode !== user.reset_token) {
            return res.status(400).send({ message: "Kode verifikasi salah." });
        }
        res.status(200).send({ message: "Kode berhasil diverifikasi." });
    } catch (error) {
        res.status(500).send({ message: "Terjadi kesalahan pada server." });
    }
};

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

        // ✅ PERBAIKAN: Tambahkan field 'avatar' ke dalam response
        res.status(200).send({
          message: "Password berhasil diubah. Anda sekarang login.",
          id: user.id, username: user.username, email: user.email, nama: user.nama,
          jenjang: user.jenjang, kelas: user.kelas, role: user.role,
          avatar: user.avatar, // <-- Tambahan di sini
          accessToken: token
        });
    } catch (error) {
        res.status(500).send({ message: "Gagal mengubah password." });
    }
};

// Deprecated, digantikan oleh verifyAndLogin
exports.loginWithCode = async (req, res) => {
    return res.status(400).send({ message: "Endpoint ini tidak lagi digunakan. Gunakan /verify-and-login" });
};