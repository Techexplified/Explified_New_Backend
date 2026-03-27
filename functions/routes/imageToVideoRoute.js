const express = require("express");
const {
  generateVideoFromImage,
} = require("../controllers/imageToVideoController");

const router = express.Router();

router.post("/", generateVideoFromImage);

module.exports = router;
