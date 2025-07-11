const express = require("express");
const { generateSubtitle } = require("../controllers/aiSubtitlerController");

const router = express.Router();

router.post("/", generateSubtitle);

module.exports = router;
