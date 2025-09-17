require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const { onRequest } = require("firebase-functions/v2/https"); // changes done here
const userRouter = require("./routes/userRoute");
const textToVideoRouter = require("./routes/textToVideoRoutes");
const imageCartoonizerRouter = require("./routes/imageCartoonizerRoutes");
const textToImageRouter = require("./routes/textToImageRoutes");
const { error } = require("firebase-functions/logger");
const globalErrorHandler = require("./controllers/errorController");
const bgRemoverRouter = require("./routes/bgRemoverRoutes");
const ytSummarizerRouter = require("./routes/ytSummarizerRoutes");
const aiSubtitlerRouter = require("./routes/aiSubtitlerRoutes");

// pdf imports
const compressRouter = require("./routes/pdfRoutes/compress.route");
const mergeRouter = require("./routes/pdfRoutes/merge.route");
const pdftowordRouter = require("./routes/pdfRoutes/pdftoword.route");
const pdftoanyRouter = require("./routes/pdfRoutes/pdftoany.route");

// bg routes
const bgRouter = require("./routes/bgRoutes");

// gemini routes
const geminiRoutes = require("./routes/geminiRoutes");
const whatsappRouter = require("./routes/whatsappRoutes");
const youtubeRouter = require("./routes/youtubeRoutes");
const aiGifGeneratorRouter = require("./routes/gifGeneratorRoute");
const aiMemeGeneratorRouter = require("./routes/memeGeneratorRoute");

const uploadFile = require("./controllers/client-sheet-store/uploadExcel");
const salesRouter = require("./controllers/SalesBotController");

const app = express();

app.use(
  cors({
    origin: [
      "https://explified-home.web.app",
      "https://app.explified.com",
      "https://www.youtube.com",
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.options("*", cors());
// app.use(fileUpload());
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } })); // 50MB
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());

// pdf settings
app.use(express.static("compressed"));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api", uploadFile);
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

// pdf routes
app.use("/compress", compressRouter);
app.use("/merge", mergeRouter);
app.use("/pdftoword", pdftowordRouter);
app.use("/pdftoany", pdftoanyRouter);

// for pptmaker
app.use("/api/gemini", geminiRoutes);
// bg remover
app.use("/api/bg", bgRouter);

app.use("/api/whatsapp", whatsappRouter);
app.use("/api/youtube", youtubeRouter);

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
