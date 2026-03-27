const express = require("express");
const {
  generateSubtitle,
  changeSubtitleLanguage,
  generateSynonyms,
} = require("../controllers/aiSubtitlerController");

const router = express.Router();

router.post("/", generateSubtitle);
router.post("/language", changeSubtitleLanguage);
router.post("/synonyms", generateSynonyms);

module.exports = router;
