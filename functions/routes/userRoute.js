const express = require("express");
const router = express.Router();
const { signup, login, logOut } = require("../controllers/userController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logOut);

module.exports = router;
