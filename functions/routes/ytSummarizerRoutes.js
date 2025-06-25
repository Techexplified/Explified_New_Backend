const express = require("express");

const {
  youtubeSummary,
  youtubeTranscript,
} = require("../controllers/ytSummarizerController");

const router = express.Router();

router.post("/transcript", youtubeTranscript);
router.post("/summary", youtubeSummary);

module.exports = router;
