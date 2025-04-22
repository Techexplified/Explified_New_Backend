const express = require("express");
const router = express.Router();
const { signup, login, logOut ,googleAuth} = require("../controllers/userController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logOut);
router.post('/google-auth',googleAuth);


module.exports = router;
