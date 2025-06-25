require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const functions = require("firebase-functions");
const userRouter = require("./functions/routes/userRoute");

// pdf imports
const compressRouter = require('./functions/routes/pdfRoutes/compress.route');
const mergeRouter = require('./functions/routes/pdfRoutes/merge.route');
const pdftowordRouter = require('./functions/routes/pdfRoutes/pdftoword.route');
const pdftoanyRouter = require('./functions/routes/pdfRoutes/pdftoany.route');

const port = process.env.PORT || 3000;
const app = express();


app.use(
  cors({
    origin: ["https://explified-home.web.app","http://localhost:5173"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"], // Allow PATCH method
    credentials: true,
  })
);
app.options("*", cors());
app.use(express.json());
app.use(cookieParser());

// pdf settings
app.use(express.static('compressed'));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// pdf routes
app.use('/compress',compressRouter);
app.use('/merge',mergeRouter);
app.use('/pdftoword',pdftowordRouter);
app.use('/pdftoany',pdftoanyRouter);

//ROUTES
app.use("/api/users", userRouter);


app.get("/firebase-status", async (req, res) => {
  try {
    // Simple Firestore read to verify connection
    res.status(200).json({ message: "Firebase connected successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Firebase connection failed!", error: error.message });
  }
});

exports.api = functions.https.onRequest(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
