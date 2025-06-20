const axios = require("axios");
const { YoutubeTranscript } = require("youtube-transcript");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../config/db");

const youtubeTranscript = async (req, res, next) => {
  try {
    const { videoId } = req.body;

    const cleanVideoId = String(videoId)
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "");

    const options = {
      method: "GET",
      url: "https://youtube-transcript3.p.rapidapi.com/api/transcript",
      params: {
        videoId: cleanVideoId,
      },
      headers: {
        "x-rapidapi-key": "5c43358bb7msh620384fe8a16560p1a0fd1jsn853ee75f7459",
        "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
      },
    };

    // transcript generation using YoutubeTranscript npm package
    const response = await axios.request(options);
    console.log(response.data.transcript);
    const transcript = response.data.transcript;

    // console.log(transcript);

    const paragraph = transcript.map((item) => item.text).join(" ");

    function groupTranscriptBySentences(transcript, sentencesPerGroup = 6) {
      const grouped = [];
      for (let i = 0; i < transcript.length; i += sentencesPerGroup) {
        const chunk = transcript.slice(i, i + sentencesPerGroup);
        const timestamp = chunk[0].offset;
        const text = chunk.map((entry) => entry.text).join(" ");
        grouped.push({ timestamp, text });
      }
      return grouped;
    }

    const result = groupTranscriptBySentences(transcript, 6);

    console.log(result);

    res.status(201).json({
      message: "Summary generated successfully",
      content: result,
    });
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
// const youtubeTranscript = async (req, res, next) => {
//   try {
//     const { videoId } = req.body;

//     const cleanVideoId = String(videoId)
//       .trim()
//       .replace(/[^a-zA-Z0-9_-]/g, "");

//     // transcript generation using YoutubeTranscript npm package
//     const transcript = await YoutubeTranscript.fetchTranscript("M7FIvfx5J10");
//     console.log(cleanVideoId);

//     console.log(transcript);

//     // const paragraph = transcript.map((item) => item.text).join(" ");

//     function groupTranscriptBySentences(transcript, sentencesPerGroup = 6) {
//       const grouped = [];
//       for (let i = 0; i < transcript.length; i += sentencesPerGroup) {
//         const chunk = transcript.slice(i, i + sentencesPerGroup);
//         const timestamp = chunk[0].offset;
//         const text = chunk.map((entry) => entry.text).join(" ");
//         grouped.push({ timestamp, text });
//       }
//       return grouped;
//     }

//     const result = groupTranscriptBySentences(transcript, 6);

//     console.log(result);

//     res.status(201).json({
//       message: "Summary generated successfully",
//       content: result,
//     });
//   } catch (error) {
//     console.error(
//       "Error:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

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

module.exports = { youtubeSummary, youtubeTranscript };

// const youtubeSummary = async (req, res, next) => {
//   try {
//     const { videoUrl } = req.body;
//     const match = videoUrl.match(/v=([^&]+)/);
//     const videoId = match[1];

//     const cleanVideoId = String(videoId)
//       .trim()
//       .replace(/[^a-zA-Z0-9_-]/g, "");

//     // transcript generation using YoutubeTranscript npm package
//     const transcript = await YoutubeTranscript.fetchTranscript(cleanVideoId);
//     const paragraph = transcript.map((item) => item.text).join(" ");

//     // summary generation using GEMINI 2.0 flash
//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//     const prompt = `Generate a detailed summary of this text - ${paragraph}`;
//     const result = await model.generateContent(prompt);
//     const summary = result.response.text();

//     // const userRef = db.collection("users").doc(userId);
//     // const userDoc = await userRef.get();
//     // if (!userDoc.exists) {
//     //   return res.status(404).json({ message: "User not found" });
//     // }
//     // const userData = userDoc.data();
//     // const history = Array.isArray(userData.history) ? userData.history : [];

//     // const newEntry = {
//     //   videoId,
//     //   summary,
//     //   createdAt: admin.firestore.Timestamp.now(),
//     // };

//     // const updatedHistory = [newEntry, ...history].slice(0, 10);

//     // await userRef.update({ history: updatedHistory });

//     res.status(201).json({
//       message: "Summary generated successfully",
//       content: summary,
//     });
//   } catch (error) {
//     console.error(
//       "Error:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };
