// contoh-sesm-server/controllers/index.js
const authController = require('./auth.controller.js');
const subjectController = require('./subject.controller.js');
const userController = require('./user.controller.js');
const materiController = require('./materi.controller.js');
const nilaiController = require('./nilai.controller.js');
const quizController = require('./quiz.controller.js');
const pointController = require('./point.controller.js');
const diaryController = require('./diary.controller.js');
const bookmarkController = require('./bookmark.controller.js');
const draftController = require('./draft.controller.js');
const interactiveStoryController = require('./interactivestory.controller.js');
const writingController = require('./writing.controller.js'); // Pastikan ini ada
const drawingController = require('./drawing.controller.js'); // Pastikan ini ada
const agendaController = require('./agenda.controller.js'); // Pastikan ini ada

module.exports = {
  authController,
  subjectController,
  userController,
  materiController,
  nilaiController,
  quizController,
  pointController,
  diaryController,
  bookmarkController,
  draftController,
  writingController,
  drawingController,
  interactiveStoryController,
  agendaController,
};