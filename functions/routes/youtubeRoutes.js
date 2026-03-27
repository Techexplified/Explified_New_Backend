const express = require("express");
const multer = require("multer");
const {
  getAuthUrl,
  handleOAuthCallback,
  uploadVideo,
} = require("../controllers/youtubeController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/auth", getAuthUrl);
router.get("/oauth2callback", handleOAuthCallback);
router.post("/upload", upload.single("video"), uploadVideo);

module.exports = router;
