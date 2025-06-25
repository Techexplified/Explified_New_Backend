const express = require("express");
const multer = require("multer");
const { createCartoon } = require("../controllers/imageCartoonizerController");

const router = express.Router();
const upload = multer();

router.post("/cartoonize", upload.any(), createCartoon);

module.exports = router;
