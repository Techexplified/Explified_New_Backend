const axios = require("axios");
const { YoutubeTranscript } = require("youtube-transcript");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const youtubeSummary = async (req, res, next) => {
  try {
    const { videoId } = req.body;

    const cleanVideoId = String(videoId)
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "");

    // transcript generation using YoutubeTranscript npm package
    const transcript = await YoutubeTranscript.fetchTranscript(cleanVideoId);
    const paragraph = transcript.map((item) => item.text).join(" ");

    // summary generation using GEMINI 2.0 flash

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Generate a summary of this text - ${paragraph}`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.status(201).json({
      message: "Summary generated successfully",
      content: summary,
    });
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

module.exports = { youtubeSummary };
