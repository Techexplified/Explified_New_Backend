require("dotenv").config();
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const functions = require("firebase-functions");
const userRouter = require("./functions/routes/userRoute");

// pdf imports
const compressRouter = require("./functions/routes/pdfRoutes/compress.route");
const mergeRouter = require("./functions/routes/pdfRoutes/merge.route");
const pdftowordRouter = require("./functions/routes/pdfRoutes/pdftoword.route");
const pdftoanyRouter = require("./functions/routes/pdfRoutes/pdftoany.route");

const geminiRoutes = require("./functions/routes/geminiRoutes");
const bgRouter = require("./functions/routes/bgRoutes");

const textToVideoRouter = require("./functions/routes/textToVideoRoutes");
const imageCartoonizerRouter = require("./functions/routes/imageCartoonizerRoutes");
const textToImageRouter = require("./functions/routes/textToImageRoutes");
const globalErrorHandler = require("./functions/controllers/errorController");
const bgRemoverRouter = require("./functions/routes/bgRemoverRoutes");
const ytSummarizerRouter = require("./functions/routes/ytSummarizerRoutes");
const aiSubtitlerRouter = require("./functions/routes/aiSubtitlerRoutes");

const whatsappRoutes = require("./functions/routes/whatsappRoutes");
const youtubeRouter = require("./functions/routes/youtubeRoutes");
const aiGifGeneratorRouter = require("./functions/routes/gifGeneratorRoute");
const aiMemeGeneratorRouter = require("./functions/routes/memeGeneratorRoute");
const imageToVideoRouter = require("./functions/routes/imageToVideoRoute");
const salesRouter = require("./functions/controllers/SalesBotController");

const uploadFile = require("./functions/controllers/client-sheet-store/uploadExcel");

const port = process.env.PORT1 || 3000;
const app = express();

app.use(
  cors({
    origin: [
      "https://explified-home.web.app",
      "https://app.explified.com",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"], // Allow PATCH method
    credentials: true,
  })
);
app.options("*", cors());
app.use(fileUpload());
app.use(express.json({ limit: "4mb" }));
// app.use(express.json());
app.use(cookieParser());

// app.use(bodyParser.json());

// pdf settings
app.use(express.static("compressed"));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

// pdf routes
app.use("/compress", compressRouter);
app.use("/merge", mergeRouter);
app.use("/pdftoword", pdftowordRouter);
app.use("/pdftoany", pdftoanyRouter);

// for pptmaker
app.use("/api/gemini", geminiRoutes);
// for bgRemoverBlur
app.use("/api/bg", bgRouter);

app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/youtube", youtubeRouter);

//ROUTES
app.use("/api/sales", salesRouter);
app.use("/api/users", userRouter);
app.use("/api/textToVideos", textToVideoRouter);
app.use("/api/textToImage", textToImageRouter);
app.use("/api/imageCartoonizer", imageCartoonizerRouter);
app.use("/api/bgRemover", bgRemoverRouter);
app.use("/api/ytSummarize", ytSummarizerRouter);
app.use("/api/aiSubtitler", aiSubtitlerRouter);
app.use("/api/aiGifGenerator", aiGifGeneratorRouter);
app.use("/api/aiMemeGenerator", aiMemeGeneratorRouter);
app.use("/api/imageToVideo", imageToVideoRouter);

app.use("/api", uploadFile);

app.use("/uploads/:filename", (req, res) => {
  const file = path.join(
    __dirname,
    "functions",
    "uploads",
    req.params.filename
  );
  res.download(file);
});

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
