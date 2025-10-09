const authRoutes = require('./auth.routes.js');
const subjectRoutes = require('./subject.routes.js');
const userRoutes = require('./user.routes.js');

module.exports = function(app) {
  authRoutes(app);
  subjectRoutes(app);
  userRoutes(app);
};