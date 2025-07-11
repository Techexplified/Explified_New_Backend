const express = require("express");

const {
  youtubeSummary,
  answerTranscript,
  youtubeTranscript,
  languageChange,
  deepSearch,
} = require("../controllers/ytSummarizerController");

const router = express.Router();

router.post("/transcript", youtubeTranscript);
router.post("/translate-transcript", languageChange);
router.post("/answerTranscript", answerTranscript);
router.post("/summary", youtubeSummary);
router.post("/deepsearch", deepSearch);

module.exports = router;
