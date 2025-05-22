const express = require("express");
const { removeBackground } = require("../controllers/bgRemoverController");

const router = express.Router();

router.post("/", removeBackground);

module.exports = router;
