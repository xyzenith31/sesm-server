const authRoutes = require('./auth.routes.js');
const subjectRoutes = require('./subject.routes.js');
const userRoutes = require('./user.routes.js');
const materiRoutes = require('./materi.routes.js'); // <-- Cukup satu file ini untuk materi

module.exports = function(app) {
  authRoutes(app);
  subjectRoutes(app);
  userRoutes(app);
  materiRoutes(app); // Daftarkan route materi yang sudah digabung
};