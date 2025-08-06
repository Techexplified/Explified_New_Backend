const express = require("express");
const router = express.Router();
const { signup, login, logOut,getUsers } = require("../controllers/userController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logOut);
router.get("/getUsers", getUsers);

module.exports = router;
