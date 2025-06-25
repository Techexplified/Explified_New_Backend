const express = require("express");
const { createTextToImage } = require("../controllers/textToImageController");

const router = express.Router();

router.post("/", createTextToImage);

module.exports = router;
