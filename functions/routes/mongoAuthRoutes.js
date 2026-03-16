const express = require("express");
const passport = require("passport");

const {
  signup,
  login,
  googleSuccess,
  logoutUser,
  protect,
  getProfile,
} = require("../controllers/mongoAuthController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/profile", protect, getProfile);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=OAuth failed`,
  }),
  googleSuccess,
);

router.get("/logout", logoutUser);

module.exports = router;
