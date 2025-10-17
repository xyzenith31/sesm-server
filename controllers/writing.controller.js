// contoh-sesm-server/controllers/writing.controller.js
const WritingProject = require("../models/writing.model.js");
const { v4: uuidv4 } = require('uuid'); // Impor uuid

exports.getAllProjects = async (req, res) => {
    try {
        const projects = await WritingProject.findAllByUser(req.userId);
        res.status(200).json(projects);
    } catch (error) {
        console.error("GET WRITING PROJECTS ERROR:", error);
        res.status(500).send({ message: "Gagal mengambil proyek." });
    }
};

exports.createProject = async (req, res) => {
    try {
        // PERBAIKAN UTAMA: Buat UUID di server
        const projectData = {
            uuid: uuidv4(), // Generate UUID di sini
            userId: req.userId,
            ...req.body
        };
        const project = await WritingProject.create(projectData);
        res.status(201).json(project);
    } catch (error) {
        console.error("CREATE WRITING PROJECT ERROR:", error);
        res.status(500).send({ message: "Gagal membuat proyek baru." });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const affectedRows = await WritingProject.update(req.params.uuid, req.userId, req.body);
        if (affectedRows === 0) return res.status(404).send({ message: "Proyek tidak ditemukan atau Anda tidak punya akses." });
        res.status(200).send({ message: "Proyek berhasil disimpan." });
    } catch (error) {
        console.error("UPDATE WRITING PROJECT ERROR:", error);
        res.status(500).send({ message: "Gagal menyimpan proyek." });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const affectedRows = await WritingProject.delete(req.params.uuid, req.userId);
        if (affectedRows === 0) return res.status(404).send({ message: "Proyek tidak ditemukan atau Anda tidak punya akses." });
        res.status(200).send({ message: "Proyek berhasil dihapus." });
    } catch (error) {
        console.error("DELETE WRITING PROJECT ERROR:", error);
        res.status(500).send({ message: "Gagal menghapus proyek." });
    }
};