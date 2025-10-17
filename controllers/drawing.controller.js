// contoh-sesm-server/controllers/drawing.controller.js
const DrawingProject = require("../models/drawing.model.js");
const { v4: uuidv4 } = require('uuid'); // Impor uuid

exports.getAllProjects = async (req, res) => {
    try {
        const projects = await DrawingProject.findAllByUser(req.userId);
        res.status(200).json(projects);
    } catch (error) {
        console.error("GET DRAWING PROJECTS ERROR:", error);
        res.status(500).send({ message: "Gagal mengambil kanvas." });
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
        const project = await DrawingProject.create(projectData);
        res.status(201).json(project);
    } catch (error) {
        console.error("CREATE DRAWING PROJECT ERROR:", error);
        res.status(500).send({ message: "Gagal membuat kanvas baru." });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const affectedRows = await DrawingProject.update(req.params.uuid, req.userId, req.body);
        if (affectedRows === 0) return res.status(404).send({ message: "Kanvas tidak ditemukan atau Anda tidak punya akses." });
        res.status(200).send({ message: "Kanvas berhasil disimpan." });
    } catch (error) {
        console.error("UPDATE DRAWING PROJECT ERROR:", error);
        res.status(500).send({ message: "Gagal menyimpan kanvas." });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const affectedRows = await DrawingProject.delete(req.params.uuid, req.userId);
        if (affectedRows === 0) return res.status(404).send({ message: "Kanvas tidak ditemukan atau Anda tidak punya akses." });
        res.status(200).send({ message: "Kanvas berhasil dihapus." });
    } catch (error) {
        console.error("DELETE DRAWING PROJECT ERROR:", error);
        res.status(500).send({ message: "Gagal menghapus kanvas." });
    }
};