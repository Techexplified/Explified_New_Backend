const express = require("express");
const { createCartoon } = require("../controllers/imageCartoonizerController");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post("/", upload.single("image"), createCartoon);

module.exports = router;
