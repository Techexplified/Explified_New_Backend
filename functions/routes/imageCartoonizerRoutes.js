const express = require("express");
const { createCartoon } = require("../controllers/imageCartoonizerController");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.post("/", upload.single("image"), createCartoon);

module.exports = router;
