const authRoutes = require('./auth.routes.js');
const subjectRoutes = require('./subject.routes.js');
const userRoutes = require('./user.routes.js');
const materiRoutes = require('./materi.routes.js');
const nilaiRoutes = require('./nilai.routes.js');
const quizRoutes = require('./quiz.routes.js'); // <-- 1. Impor rute baru

module.exports = function(app) {
  authRoutes(app);
  subjectRoutes(app);
  userRoutes(app);
  materiRoutes(app);
  nilaiRoutes(app);
  quizRoutes(app); // <-- 2. Daftarkan rute baru
};