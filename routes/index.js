// contoh-sesm-server/routes/index.js
const authRoutes = require('./auth.routes.js');
const subjectRoutes = require('./subject.routes.js');
const userRoutes = require('./user.routes.js');
const materiRoutes = require('./materi.routes.js');
const nilaiRoutes = require('./nilai.routes.js');
const quizRoutes = require('./quiz.routes.js');
const pointRoutes = require('./point.routes.js'); // ✅ Pastikan ini ada
const diaryRoutes = require('./diary.routes.js');
const bookmarkRoutes = require('./bookmark.routes.js');
const draftRoutes = require('./draft.routes.js');

module.exports = function(app) {
  authRoutes(app);
  subjectRoutes(app);
  userRoutes(app);
  materiRoutes(app);
  nilaiRoutes(app);
  quizRoutes(app);
  pointRoutes(app); // ✅ Pastikan fungsi ini dipanggil
  diaryRoutes(app);
  bookmarkRoutes(app);
  draftRoutes(app);
};