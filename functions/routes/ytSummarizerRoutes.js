const express = require("express");

const { youtubeSummary } = require("../controllers/ytSummarizerController");

const router = express.Router();

router.post("/", youtubeSummary);

module.exports = router;
