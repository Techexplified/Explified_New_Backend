const express = require("express");
const {
  generateMemeId,
  generateMeme,
} = require("../controllers/memeGeneratorController");

const router = express.Router();

router.post("/", generateMemeId);
router.post("/get-meme", generateMeme);

module.exports = router;
