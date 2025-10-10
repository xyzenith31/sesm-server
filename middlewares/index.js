const authJwt = require('./auth.jwt.js');
const verifyRegister = require('./verify.register.js');
const upload = require('./upload.middleware.js'); // <-- Tambahkan baris ini

module.exports = {
  authJwt,
  verifyRegister,
  upload, // <-- Ekspor di sini
};