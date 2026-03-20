const { promisify } = require("util");
const User = require("../models/mongoUserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateAndSendToken = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie("__session", token, {
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none",
  });
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      provider: "local",
    });

    generateAndSendToken(res, user._id);

    res.status(201).json({
      status: "success",
      message: "Login successful",
      data: {
        _id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.provider === "google" && !user.password) {
      return res.status(400).json({
        success: false,
        message: "This account was created using Google",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    generateAndSendToken(res, user._id);

    res.status(201).json({
      status: "success",
      message: "Login successful",
      data: {
        _id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies.__session) {
      token = req.cookies.__session;
    }

    if (!token) {
      return res.status(401).json({ error: "Please log in to get access." });
    }

    const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ error: "User doesn't exist." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const getProfile = (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      _id: req.user._id,
      fullname: req.user.fullname,
      email: req.user.email,
    },
  });
};

const googleSuccess = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
      );
    }

    const user = req.user;

    generateAndSendToken(res, user._id);

    res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

const logoutUser = (req, res) => {
  res.cookie("__session", "", { maxAge: 0 });
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

module.exports = {
  signup,
  login,
  protect,
  logoutUser,
  getProfile,
  googleSuccess,
};
