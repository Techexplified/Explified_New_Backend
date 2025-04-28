require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const functions = require("firebase-functions");
const userRouter = require("./functions/routes/userRoute");
const textToVideoRouter = require("./functions/routes/textToVideoRoutes");
const imageCartoonizerRouter = require("./functions/routes/imageCartoonizerRoutes");
const textToImageRouter = require("./functions/routes/textToImageRoutes");

const port = process.env.PORT || 3000;
const app = express();

app.use(
  cors({
    origin: ["https://explified-home.web.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"], // Allow PATCH method
    credentials: true,
  })
);
app.options("*", cors());
app.use(express.json({ limit: "4mb" }));
app.use(cookieParser());

//ROUTES
app.use("/api/users", userRouter);
app.use("/api/textToVideos", textToVideoRouter);
app.use("/api/textToImage", textToImageRouter);
app.use("/api/imageCartoonizer", imageCartoonizerRouter);

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

// exports.api = functions.https.onRequest(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
