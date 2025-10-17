// contoh-sesm-server/models/index.js
const User = require('./user.model.js');
const Materi = require('./materi.model.js');
const Point = require('./point.model.js');
const Quiz = require('./quiz.model.js');
const Subject = require('./subject.model.js');
const Diary = require('./diary.model.js');
const Bookmark = require('./bookmark.model.js');
const Draft = require('./draft.model.js');
const WritingProject = require('./writing.model.js');
const DrawingProject = require('./drawing.model.js');
const InteractiveStory = require('./interactivestory.model.js'); // Tambahkan ini

module.exports = {
  User,
  Materi,
  Point,
  Quiz,
  Subject,
  Diary,
  Bookmark,
  Draft,
  WritingProject,
  DrawingProject,
  InteractiveStory, // Tambahkan ini
};