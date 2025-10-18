// contoh-sesm-server/controllers/agenda.controller.js
const Agenda = require("../models/agenda.model.js");

exports.createAgenda = async (req, res) => {
    try {
        const agendaData = { 
            userId: req.userId, 
            title: req.body.title,
            date: req.body.date,
            description: req.body.description, // Pastikan semua field diambil
            color: req.body.color,
        };

        if (!agendaData.title || !agendaData.date) {
            return res.status(400).send({ message: "Judul dan tanggal wajib diisi." });
        }
        const newAgenda = await Agenda.create(agendaData);
        res.status(201).send(newAgenda);
    } catch (error) {
        console.error("CREATE AGENDA CONTROLLER ERROR:", error); // Log error untuk debugging
        res.status(500).send({ message: "Gagal membuat agenda: " + error.message });
    }
};

exports.getAgendas = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).send({ message: "Parameter startDate dan endDate dibutuhkan." });
    }
    try {
        const agendas = await Agenda.findByUserAndDateRange(req.userId, startDate, endDate);
        res.status(200).json(agendas);
    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil agenda: " + error.message });
    }
};

exports.deleteAgenda = async (req, res) => {
    try {
        const affectedRows = await Agenda.delete(req.params.id, req.userId);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Agenda tidak ditemukan atau Anda tidak memiliki izin." });
        }
        res.status(200).send({ message: "Agenda berhasil dihapus." });
    } catch (error) {
        res.status(500).send({ message: "Gagal menghapus agenda: " + error.message });
    }
};