const express = require("express");
const multer = require("multer");
const { createCartoon } = require("../controllers/imageCartoonizerController");

const router = express.Router();
const upload = multer();

router.post("/cartoonize", upload.single("image"), createCartoon);

module.exports = router;
