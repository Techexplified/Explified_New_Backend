const express = require("express");
const multer = require("multer");
const {removeBackground , blurBackground } = require("../controllers/bgRemover-blur.Controller");

const router = express.Router();
const upload = multer({ dest: 'uploads/' });


// POST /api/gemini/topic
router.post("/remove-bg",upload.single('image'),removeBackground );
router.post("/blur-bg",upload.single('image'),blurBackground);

module.exports = router;