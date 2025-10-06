const express = require("express");
const {
  createTextToVideo,
  getAllTextToVideos,
} = require("../controllers/textToVideoController");

const router = express.Router();

router.get("/", getAllTextToVideos);
router.post("/", createTextToVideo);

module.exports = router;
