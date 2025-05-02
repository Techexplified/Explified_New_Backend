const express = require("express");
const { createCartoon } = require("../controllers/imageCartoonizerController");

const router = express.Router();

router.post("/cartoonize", createCartoon);

module.exports = router;
