const { fileURLToPath } = require("url");
const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { fileUpload } = require("../utils/fileUpload");

async function getContent(file) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        },
      },
      {
        text: "You need to write a subtitle for this full video, write the subtitle in the SRT format, don't write anything else other than a subtitle in the response, create accurate subtitle.",
      },
    ]);
    return result.response.text();
  } catch (error) {
    throw error;
  }
}

const generateSubtitle = async (req, res, next) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    const videoFile = req.files.video;
    const uploadDir = path.join(__dirname, "..", "uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const uploadPath = path.join(uploadDir, videoFile.name);

    await videoFile.mv(uploadPath);

    const response = await fileUpload(uploadPath, req.files.video); //we pass 'uploadPath' and the video file data to 'fileUpload'
    const genContent = await getContent(response); //the 'response' (containing the file URI) is passed to 'getContent'

    console.log("subs", genContent);

    res.status(201).json({
      message: "Subtitle generated successfully",
      content: genContent,
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
  generateSubtitle,
};
