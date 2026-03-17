require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const { onRequest } = require("firebase-functions/v2/https"); // changes done here

const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { db } = require("./config/db");

const EMAIL_AUTOMATION_COLLECTION = "email_automation_users";

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
const trainingRouter = require("./controllers/TrainingmoduleController");

const emailAutomationRoutes = require("./routes/emailAutomationRoutes");
const aiChatRouter = require("./routes/aiChatRoutes");
const mongoAuthRouter = require("./routes/mongoAuthRoutes");
const connectDB = require("./config/mongodb");

const app = express();

connectDB();

// Upload route FIRST - before any middleware that could interfere

app.use("/api-upload", uploadFile); // Changed to api-upload to avoid conflicts

app.use(
  cors({
    origin: [
      "https://www.youtube.com",
      "chrome-extension://nogdjeiacjdpcchkadlpffcbojffmdka",
      "https://explified-home.web.app",
      "https://app.explified.com",
      "https://expli.explified.com",
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.options("*", cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "explified-session",
    resave: false,
    saveUninitialized: true,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

if (
  process.env.GOOGLE_CLIENT_ID_EMAIL &&
  process.env.GOOGLE_CLIENT_SECRET_EMAIL
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID_EMAIL,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET_EMAIL,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const userId = profile.id;
          const email = profile.emails[0].value;

          // Check if user already exists in Firestore
          const snapshot = await db
            .collection(EMAIL_AUTOMATION_COLLECTION)
            .where("userId", "==", userId)
            .limit(1)
            .get();

          let userDocRef;
          if (snapshot.empty) {
            // Create new user document
            const newUser = {
              userId,
              gmailAccessToken: accessToken,
              gmailRefreshToken: refreshToken,
              email,
              telegramChatId: null,
              lastProcessed: null,
              intervalMinutes: 5,
              userGeminiApiKey: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            userDocRef = await db
              .collection(EMAIL_AUTOMATION_COLLECTION)
              .add(newUser);
            console.log(
              "✓ Created new email automation user in Firestore:",
              email,
            );
            return done(null, { firestoreId: userDocRef.id, userId, email });
          } else {
            // Update existing user
            userDocRef = snapshot.docs[0].ref;
            await userDocRef.update({
              gmailAccessToken: accessToken,
              gmailRefreshToken: refreshToken,
              email,
              updatedAt: new Date(),
            });
            console.log("✓ Updated email automation user in Firestore:", email);
            return done(null, {
              firestoreId: snapshot.docs[0].id,
              userId,
              email,
            });
          }
        } catch (err) {
          console.error("✗ Google OAuth Firestore error:", err);
          return done(err);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user.userId));
  passport.deserializeUser(async (id, done) => {
    try {
      const snapshot = await db
        .collection(EMAIL_AUTOMATION_COLLECTION)
        .where("userId", "==", id)
        .limit(1)
        .get();
      if (snapshot.empty) return done(null, false);
      const userData = snapshot.docs[0].data();
      done(null, { firestoreId: snapshot.docs[0].id, ...userData });
    } catch (err) {
      done(err);
    }
  });
} else {
  console.warn(
    "⚠ GOOGLE_CLIENT_ID_EMAIL or GOOGLE_CLIENT_SECRET_EMAIL not set. Email automation OAuth disabled.",
  );
}

app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } })); // 50MB
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());

// pdf settings
app.use(express.static("compressed"));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));
app.use("/api/ai", aiChatRouter);

// Routes (removed upload route since it's handled separately above)
app.use("/api/trainingmodule", trainingRouter);
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
app.use("/api/email-automation", emailAutomationRoutes);
app.use("/api/new/auth", mongoAuthRouter);

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
