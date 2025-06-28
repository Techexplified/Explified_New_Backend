const express = require("express");

const {
  youtubeSummary,
  answerTranscript,
  youtubeTranscript,
  languageChange,
} = require("../controllers/ytSummarizerController");

const router = express.Router();

router.post("/transcript", youtubeTranscript);
router.post("/translate-transcript", languageChange);
router.post("/answerTranscript", answerTranscript);
router.post("/summary", youtubeSummary);

module.exports = router;
