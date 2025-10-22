// contoh-sesm-server/routes/index.js
const agendaRoutes = require('./agenda.routes.js');
const authRoutes = require('./auth.routes.js');
const bookmarkRoutes = require('./bookmark.routes.js');
const challengeRoutes = require('./challenge.routes.js');
const diaryRoutes = require('./diary.routes.js');
const draftRoutes = require('./draft.routes.js');
const drawingRoutes = require('./drawing.routes.js');
const storyRoutes = require('./interactivestory.routes.js');
const materiRoutes = require('./materi.routes.js');
const nilaiRoutes = require('./nilai.routes.js');
const pointRoutes = require('./point.routes.js');
const quizRoutes = require('./quiz.routes.js');
const subjectRoutes = require('./subject.routes.js');
const userRoutes = require('./user.routes.js');
const writingRoutes = require('./writing.routes.js');
const feedbackRoutes = require('./feedback.routes.js'); // <-- PASTIKAN INI ADA

module.exports = function(app) {
  agendaRoutes(app);
  authRoutes(app);
  bookmarkRoutes(app);
  challengeRoutes(app);
  diaryRoutes(app);
  draftRoutes(app);
  drawingRoutes(app);
  storyRoutes(app);
  materiRoutes(app);
  nilaiRoutes(app);
  pointRoutes(app);
  quizRoutes(app);
  subjectRoutes(app);
  userRoutes(app);
  writingRoutes(app);
  feedbackRoutes(app); // <-- PASTIKAN INI DIPANGGIL
};