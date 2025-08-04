const express = require("express");
const {
  generateGIF,
  generateGIFId,
} = require("../controllers/gifGeneratorController");

const router = express.Router();

router.post("/", generateGIFId);
router.post("/getgif", generateGIF);

module.exports = router;
