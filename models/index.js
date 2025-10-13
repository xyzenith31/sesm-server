// contoh-sesm-server/models/index.js
const User = require('./user.model.js');
const Materi = require('./materi.model.js');
const Point = require('./point.model.js');
const Quiz = require('./quiz.model.js');
const Subject = require('./subject.model.js');

module.exports = {
  User,
  Materi,
  Point,
  Quiz,
  Subject,
};