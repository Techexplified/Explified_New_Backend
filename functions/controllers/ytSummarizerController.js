const axios = require("axios");
const { YoutubeTranscript } = require("youtube-transcript");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../config/db");

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
// const youtubeTranscript = async (req, res, next) => {
//   try {
//     const { videoId } = req.body;

//     const cleanVideoId = String(videoId)
//       .trim()
//       .replace(/[^a-zA-Z0-9_-]/g, "");

//     const options = {
//       method: "GET",
//       url: "https://youtube-transcript3.p.rapidapi.com/api/transcript",
//       params: {
//         videoId: cleanVideoId,
//       },
//       headers: {
//         "x-rapidapi-key": process.env.RAPID_API_KEY_SARITA,
//         "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
//       },
//     };

//     // transcript generation using YoutubeTranscript npm package
//     const response = await axios.request(options);

//     const transcript = response.data.transcript;

//     // console.log(transcript);

//     const paragraph = transcript.map((item) => item.text).join(" ");

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

//     // console.log(result);

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
const youtubeTranscript = async (req, res, next) => {
  try {
    const { videoId } = req.body;

    const cleanVideoId = String(videoId)
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "");

    const options = {
      method: "GET",
      url: "https://youtube-transcriptor.p.rapidapi.com/transcript",
      params: {
        video_id: cleanVideoId,
        lang: "en",
      },
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY_SARITA,
        "x-rapidapi-host": "youtube-transcriptor.p.rapidapi.com",
      },
    };

    // transcript generation using YoutubeTranscript npm package
    const response = await axios.request(options);

    const transcript = response.data[0].transcription;

    function groupTranscriptBySentences(transcript, sentencesPerGroup = 6) {
      const grouped = [];
      for (let i = 0; i < transcript.length; i += sentencesPerGroup) {
        const chunk = transcript.slice(i, i + sentencesPerGroup);
        const timestamp = chunk[0].start; // 'start' instead of 'offset'
        const text = chunk.map((entry) => entry.subtitle).join(" "); // 'subtitle' instead of 'text'
        grouped.push({ timestamp, text });
      }
      return grouped;
    }

    const result = groupTranscriptBySentences(transcript, 6);

    // console.log(result);

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

const youtubeSummary = async (req, res, next) => {
  try {
    const { videoId } = req.body;

    const cleanVideoId = String(videoId)
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "");

    const options = {
      method: "GET",
      url: "https://youtube-transcriptor.p.rapidapi.com/transcript",
      params: {
        video_id: cleanVideoId,
        lang: "en",
      },
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY_SARITA,
        "x-rapidapi-host": "youtube-transcriptor.p.rapidapi.com",
      },
    };

    // transcript generation using YoutubeTranscript npm package
    const response = await axios.request(options);

    const transcript = response.data[0].transcription;

    function groupTranscriptBySentences(transcript, sentencesPerGroup = 6) {
      const grouped = [];
      for (let i = 0; i < transcript.length; i += sentencesPerGroup) {
        const chunk = transcript.slice(i, i + sentencesPerGroup);
        const timestamp = chunk[0].start; // 'start' instead of 'offset'
        const text = chunk.map((entry) => entry.subtitle).join(" "); // 'subtitle' instead of 'text'
        grouped.push({ timestamp, text });
      }
      return grouped;
    }

    const result = groupTranscriptBySentences(transcript, 6);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Step 3: Chunk transcript (every 4 items for now)
    const chunkSize = 40;
    const summaries = [];

    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);
      const startTime = formatTime(chunk[0]?.timestamp || 0);
      const endTime = formatTime(chunk[chunk.length - 1]?.timestamp || 0);
      const combinedText = chunk.map((item) => item.text).join(" ");

      const prompt = `
You're an AI assistant. Summarize the following content spoken between timestamps ${startTime} and ${endTime}.

TEXT:
${combinedText}

Return a short and clear summary.
      `;

      const response2 = await model.generateContent(prompt);
      const summary = response2.response.text();
      summaries.push({ timeRange: `${startTime} - ${endTime}`, summary });
    }

    res.status(201).json({
      message: "Summary generated successfully",
      content: summaries,
    });
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

const answerTranscript = async (req, res, next) => {
  try {
    const { transcriptText, question } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Generate answer in english based on the video transcript. Transcript: ${transcriptText}\n\nQuestion: ${question}`;
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.status(201).json({
      message: "Summary generated successfully",
      content: answer,
    });
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

const translateLine = async (text, source = "auto", target) => {
  try {
    const response = await axios.request({
      method: "POST",
      url: "https://deep-translate1.p.rapidapi.com/language/translate/v2",
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY_SARITA,
        "x-rapidapi-host": "deep-translate1.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      data: {
        q: text,
        source,
        target,
      },
    });

    // console.log(response.data.data.translations.translatedText);

    return response.data.data.translations.translatedText[0];
  } catch (error) {
    console.error("Translation failed for:", text, error);
  }
};

const translateTranscript = async (transcript, targetLang) => {
  const translated = await Promise.all(
    transcript.map(async (item) => ({
      timestamp: item.timestamp,
      text: await translateLine(item.text, "auto", targetLang),
    }))
  );

  return translated;
};

const languageChange = async (req, res) => {
  const { transcript, language } = req.body;

  if (!transcript || !language) {
    return res
      .status(400)
      .json({ error: "Transcript and targetLang required" });
  }

  try {
    const result = await translateTranscript(transcript, language);

    res.json({ translatedTranscript: result });
  } catch (error) {
    console.error("Translation failed:", error);
    res.status(500).json({ error: "Translation failed" });
  }
};
const deepSearch = async (req, res) => {
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
        "x-rapidapi-key": process.env.RAPID_API_KEY_SARITA,
        "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);

    const transcript = response.data.transcript;
    const paragraph = transcript.map((t) => t.text).join(" ");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // const prompt1 = `Generate a overview of this text - ${paragraph}. Don't include the star symbols in the text. Just plain text.`;
    // const result1 = await model.generateContent(prompt1);
    // const summary = result1.response.text();

    // const prompt2 = `${paragraph} Give 3-5 insights on this topic with links of websites from which you took reference. If possible generate the insights in array format rather that in text format. In that array of objects keep 3 keys like insight, details and reference. The reference field should contain the link of websites related to that topic.The insight field should be of 3 lines and the details field should be of 10 lines.`;
    // const result2 = await model.generateContent(prompt2);
    // const insights = result2.response.text();

    const prompt1 = `Generate an overview of this text - ${paragraph}. Don't include the star symbols in the text. Just plain text.`;
    const prompt2 = `${paragraph} Give 3-5 insights on this topic with links of websites from which you took reference. If possible generate the insights in array format rather than in text format. In that array of objects keep 3 keys like insight, details and reference. The reference field should contain the link of websites related to that topic. The insight field should be of 3 lines and the details field should be of 10 lines.`;
    // const prompt3 = `${paragraph} Give 3 youtube video links, 3 blog post links and 3 research paper links related to this specific topic in an array of objects format. The objects should contain only two fields, type and url. Give real, active URLs from credible sources`;
    const prompt3 = `${paragraph}

Give exactly 3 YouTube video links, 3 blog post links, and 3 peer-reviewed research paper links about this topic.

Requirements:
- The resources must be current (preferably published within the last 2 years).
- Prefer credible sources (official channels, reputable blogs, trusted academic sites like arXiv, ACM, IEEE).
- The URLs must be real, active, and not placeholders.
- Output the results as a JSON array of objects.
- Each object must contain only:
  - "type": one of "youtube_video", "blog_post", "research_paper"
  - "url": direct working URL

No extra text. Return only the JSON array.`;

    const [result1, result2, result3] = await Promise.all([
      model.generateContent(prompt1),
      model.generateContent(prompt2),
      model.generateContent(prompt3),
    ]);

    const summary = result1.response.text();
    const insights = result2.response.text();
    const links = result3.response.text();

    res.status(201).json({
      message: "Summary generated successfully",
      content: insights,
      summary,
      links,
    });
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

module.exports = {
  youtubeSummary,
  youtubeTranscript,
  answerTranscript,
  languageChange,
  deepSearch,
};
