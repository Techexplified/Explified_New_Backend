const { google } = require("googleapis");
const fs = require("fs");

const oauth2Client = new google.auth.OAuth2(
  process.env.YT_CLIENT_ID,
  process.env.YT_CLIENT_SECRET,
  process.env.YT_REDIRECT_URI
);

let oauthTokens = null;

const getAuthUrl = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.upload"],
    prompt: "consent",
  });
  res.redirect(url);
};

const handleOAuthCallback = async (req, res) => {
  const code = req.query.code;
  const redirectUrl = req.query.state || "http://localhost:3000/youtube-upload"; // Fallback if state not set

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauthTokens = tokens;
    oauth2Client.setCredentials(tokens);

    // ✅ Redirect user back to the original page (sent as `state`)
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("OAuth error");
  }
};




const uploadVideo = async (req, res) => {
  if (!oauthTokens) return res.status(401).json({ error: "Not authenticated" });

  oauth2Client.setCredentials(oauthTokens);
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const { path, originalname } = req.file;

  try {
    const response = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: originalname,
          description: "Uploaded via Node.js app",
        },
        status: { privacyStatus: "unlisted" },
      },
      media: { body: fs.createReadStream(path) },
    });

    fs.unlinkSync(path); // cleanup

    res.json({ success: true, videoId: response.data.id });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

module.exports = {
  getAuthUrl,
  handleOAuthCallback,
  uploadVideo,
};
