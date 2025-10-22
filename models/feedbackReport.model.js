// contoh-sesm-server/models/feedbackReport.model.js (Contoh jika pakai Sequelize)
module.exports = (sequelize, Sequelize) => {
  const FeedbackReport = sequelize.define("feedback_report", {
    userId: { // Sesuaikan nama field jika berbeda (misal: user_id)
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'user_id' // Pastikan cocok dengan kolom DB
    },
    type: {
      type: Sequelize.ENUM('bug', 'fitur', 'saran', 'kendala'), // Tambahkan 'kendala'
      allowNull: false
    },
    title: {
      type: Sequelize.STRING,
      allowNull: true
    },
    pageContext: { // Sesuaikan nama field jika berbeda (misal: page_context)
      type: Sequelize.STRING,
      allowNull: true,
      field: 'page_context'
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    attachmentUrl: { // Sesuaikan nama field jika berbeda (misal: attachment_url)
      type: Sequelize.STRING(512),
      allowNull: true,
      field: 'attachment_url'
    },
    status: {
      type: Sequelize.ENUM('baru', 'dilihat', 'diproses', 'selesai', 'ditolak'),
      allowNull: false,
      defaultValue: 'baru'
    },
    adminNotes: { // Sesuaikan nama field jika berbeda (misal: admin_notes)
      type: Sequelize.TEXT,
      allowNull: true,
      field: 'admin_notes'
    }
    // createdAt dan updatedAt otomatis oleh Sequelize jika timestamps: true
  }, {
    tableName: 'feedback_reports', // Nama tabel eksplisit
    underscored: true // Jika kolom DB pakai underscore (user_id)
  });

  return FeedbackReport;
};