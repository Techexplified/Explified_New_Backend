const express = require("express");
const multer = require("multer");
const {removeBackground , blurBackground,generateBackground, replaceWithColor,replaceWithGradient} = require("../controllers/bgRemover-blur.Controller");

const router = express.Router();
const upload = multer({ dest: 'uploads/' });


// POST /api/gemini/topic
router.post("/remove-bg",upload.single('image'),removeBackground );
router.post("/blur-bg",upload.single('image'),blurBackground);
// router.post("/ai-bg",upload.single('image'),generateBackground);
router.post('/color',upload.single('image'), replaceWithColor);
router.post('/gradient',upload.single('image'), replaceWithGradient);

module.exports = router;