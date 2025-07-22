const express = require("express");
const { contentForPresentation, imageForPresentation } = require("../controllers/geminiController");
const router = express.Router();


// POST /api/gemini/topic
router.post("/topic", contentForPresentation);
router.post("/image",imageForPresentation);

module.exports = router;
