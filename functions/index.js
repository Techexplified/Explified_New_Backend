require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { onRequest } = require("firebase-functions/v2/https"); // changes done here
const userRouter = require("./routes/userRoute");
const textToVideoRouter = require("./routes/textToVideoRoutes");
const imageCartoonizerRouter = require("./routes/imageCartoonizerRoutes");
const textToImageRouter = require("./routes/textToImageRoutes");
const { error } = require("firebase-functions/logger");
const globalErrorHandler = require("./controllers/errorController");
const bgRemoverRouter = require("./routes/bgRemoverRoutes");

const app = express();

app.use(
  cors({
    origin: ["https://explified-home.web.app", "https://www.youtube.com"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.options("*", cors());
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());

// Routes
app.use("/api/users", userRouter);
app.use("/api/textToVideos", textToVideoRouter);
app.use("/api/textToImage", textToImageRouter);
app.use("/api/imageCartoonizer", imageCartoonizerRouter);
app.use("/api/bgRemover", bgRemoverRouter);

app.get("/firebase-status", async (req, res) => {
  try {
    res.status(200).json({ message: "Firebase connected successfully!" });
  } catch (error) {
    res.status(500).json({
      message: "Firebase connection failed!",
      error: error.message,
    });
  }
});

app.all("*", (req, res, next) => {
  next(new Error(`This route ${req.originalUrl} doesn't exist.`));
});

app.use(globalErrorHandler);

// ✅ Firebase entry point
exports.api = onRequest(app);
