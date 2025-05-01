const express = require("express");
const { createCartoon } = require("../controllers/imageCartoonizerController");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.post("/", createCartoon);

module.exports = router;
