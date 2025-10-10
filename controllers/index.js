const authController = require('./auth.controller.js');
const subjectController = require('./subject.controller.js');
const userController = require('./user.controller.js');
const materiController = require('./materi.controller.js');
const nilaiController = require('./nilai.controller.js');

module.exports = {
  authController,
  subjectController,
  userController,
  materiController,
  nilaiController, // <-- Daftarkan di sini
};