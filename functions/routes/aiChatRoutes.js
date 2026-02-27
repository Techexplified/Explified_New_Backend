const express = require("express");
const router = express.Router();
const aiChatController = require("../controllers/aiChatController");

router.post("/chat", aiChatController.chatCompletion);

module.exports = router;
