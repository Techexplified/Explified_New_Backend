require("dotenv").config();
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { db } = require("./functions/config/db");

const EMAIL_AUTOMATION_COLLECTION = "email_automation_users";

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
const emailAutomationRoutes = require("./functions/routes/emailAutomationRoutes");
const youtubeRouter = require("./functions/routes/youtubeRoutes");
const aiGifGeneratorRouter = require("./functions/routes/gifGeneratorRoute");
const aiMemeGeneratorRouter = require("./functions/routes/memeGeneratorRoute");
const imageToVideoRouter = require("./functions/routes/imageToVideoRoute");
const aiChatRouter = require("./functions/routes/aiChatRoutes");
const salesRouter = require("./functions/controllers/SalesBotController");

const uploadFile = require("./functions/controllers/client-sheet-store/uploadExcel");
const trainingRouter = require("./functions/controllers/TrainingmoduleController");

const port = process.env.PORT1 || 3000;
const app = express();

app.use(
  cors({
    origin: [
      "https://www.youtube.com",
      "chrome-extension://nogdjeiacjdpcchkadlpffcbojffmdka",
      "https://explified-home.web.app",
      "https://app.explified.com",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
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

// Upload routes - MUST be before fileUpload() middleware
app.use("/api-upload", uploadFile);

app.use(fileUpload());
app.use(express.json({ limit: "4mb" }));
// app.use(express.json());
app.use(cookieParser());

// app.use(bodyParser.json());

// pdf settings
app.use(express.static("compressed"));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));
app.use("/api/ai", aiChatRouter);

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
app.use("/api/imageToVideo", imageToVideoRouter);
app.use("/api/email-automation", emailAutomationRoutes);

app.use("/api", uploadFile);

app.use("/uploads/:filename", (req, res) => {
  const file = path.join(
    __dirname,
    "functions",
    "uploads",
    req.params.filename,
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
