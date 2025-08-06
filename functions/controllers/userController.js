const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/db");
const User = require("../models/userModel");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

const generateAndSendToken = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.cookie("explified", token, {
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });
};

exports.signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Check if user already exists
    const userQuery = await db
      .collection("users")
      .where("email", "==", email)
      .get();
    if (!userQuery.empty) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and store user
    const newUser = new User(firstName, lastName, email, hashedPassword); //contains all fields as properties except the ID
    const newDoc = await db.collection("users").add({ ...newUser }); //contains only ID

    //Generate the token
    generateAndSendToken(res, newDoc.id);

    res.status(201).json({
      message: "User registered",
      user: {
        id: newDoc.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

// or specify your origin

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const userQuery = await db
      .collection("users")
      .where("email", "==", email)
      .get();
    if (userQuery.empty) {
      return res.status(404).json({ message: "User not found" });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    console.log(userData);

    // Compare password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    //Generate the token
    generateAndSendToken(res, userDoc.id);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: userDoc.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// exports.login = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     const { email, password } = req.body;

//     try {
//       // Find user by email
//       const userQuery = await db
//         .collection("users")
//         .where("email", "==", email)
//         .get();
//       if (userQuery.empty) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       const userDoc = userQuery.docs[0];
//       const userData = userDoc.data();

//       // Compare password
//       const isMatch = await bcrypt.compare(password, userData.password);
//       if (!isMatch) {
//         return res.status(401).json({ message: "Invalid credentials" });
//       }

//       //Generate the token
//       generateAndSendToken(res, userDoc.id);

//       res.status(200).json({
//         message: "Login successful",
//         user: {
//           id: userDoc.id,
//           firstName: userData.firstName,
//           lastName: userData.lastName,
//           email: userData.email,
//         },
//       });
//     } catch (error) {
//       res.status(500).json({ message: "Login failed", error: error.message });
//     }
//   });
// });

exports.logOut = (req, res) => {
  res.cookie("explified", "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};



exports.getUsers = async (req , res)=>{
   try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No users found" });
    }

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}