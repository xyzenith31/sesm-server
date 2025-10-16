// contoh-sesm-server/controllers/draft.controller.js
const Draft = require("../models/draft.model.js");

exports.saveDraft = async (req, res) => {
    try {
        await Draft.save(req.userId, req.body.draftKey, req.body.content);
        res.status(200).send({ message: "Draft saved successfully." });
    } catch (error) {
        res.status(500).send({ message: "Failed to save draft." });
    }
};

exports.getDraft = async (req, res) => {
    try {
        const draft = await Draft.get(req.userId, req.params.draftKey);
        if (draft) {
            res.status(200).json(draft);
        } else {
            res.status(404).send({ message: "Draft not found." });
        }
    } catch (error) {
        res.status(500).send({ message: "Failed to retrieve draft." });
    }
};

exports.getAllDrafts = async (req, res) => {
    try {
        const drafts = await Draft.getAll(req.userId);
        res.status(200).json(drafts);
    } catch (error) {
        res.status(500).send({ message: "Failed to retrieve drafts." });
    }
};

exports.deleteDraft = async (req, res) => {
    try {
        await Draft.delete(req.userId, req.params.draftKey);
        res.status(200).send({ message: "Draft deleted successfully." });
    } catch (error) {
        res.status(500).send({ message: "Failed to delete draft." });
    }
};