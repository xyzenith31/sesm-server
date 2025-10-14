// contoh-sesm-server/controllers/index.js
const authController = require('./auth.controller.js');
const subjectController = require('./subject.controller.js');
const userController = require('./user.controller.js');
const materiController = require('./materi.controller.js');
const nilaiController = require('./nilai.controller.js');
const quizController = require('./quiz.controller.js');
const pointController = require('./point.controller.js');
const diaryController = require('./diary.controller.js'); // Tambahkan ini

module.exports = {
  authController,
  subjectController,
  userController,
  materiController,
  nilaiController,
  quizController,
  pointController,
  diaryController, // Tambahkan ini
};