const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { fileUpload } = require("../utils/fileUpload");

// function convertToSRT(raw) {
//   const lines = raw.trim().split("\n");
//   let srt = "";
//   for (let i = 0; i < lines.length; i++) {
//     const [startTime, ...words] = lines[i].split(" ");
//     const endTime = addOneSecond(startTime);

//     const start = startTime.replace(/\./g, ",") + ",000";
//     const end = endTime.replace(/\./g, ",") + ",000";

//     srt += `${i + 1}\n${start} --> ${end}\n${words.join(" ")}\n\n`;
//   }
//   return srt.trim();
// }

function addOneSecond(timestamp) {
  const [h, m, s] = timestamp.split(":").map(Number);
  let sec = s + 1;
  let min = m;
  let hr = h;
  if (sec >= 60) {
    sec = 0;
    min++;
  }
  if (min >= 60) {
    min = 0;
    hr++;
  }
  return [hr, min, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

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
        text: "Generate SRT subtitles with one word per subtitle line. Each subtitle entry must follow valid SRT format, with index, start and end timestamp in 00:00:00,000 --> 00:00:01,000 format. Do not use parentheses or invalid timestamp formats.",
      },
    ]);
    return result.response.text();
  } catch (error) {
    throw error;
  }
}

// const generateSubtitle = async (req, res, next) => {
//   try {
//     if (!req.files || !req.files.video) {
//       return res.status(400).json({ error: "No video uploaded" });
//     }

//     const videoFile = req.files.video;
//     const uploadDir = path.join(__dirname, "..", "uploads");

//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir);
//     }

//     const uploadPath = path.join(uploadDir, videoFile.name);

//     await videoFile.mv(uploadPath);

//     const response = await fileUpload(uploadPath, req.files.video);
//     const srtContent = await getContent(response);

//     const srtPath = path.join(
//       uploadDir,
//       `${path.parse(videoFile.name).name}.srt`
//     );
//     fs.writeFileSync(srtPath, srtContent, "utf-8");

//     const outputVideoPath = path.join(
//       uploadDir,
//       `${path.parse(videoFile.name).name}-subtitled.mp4`
//     );

//     const input = uploadPath.replace(/\\/g, "/");
//     const srt = srtPath.replace(/\\/g, "/");
//     const srtF = srt.replace(/^([A-Za-z]):/, "$1\\:");
//     const output = outputVideoPath.replace(/\\/g, "/");

//     // console.log(input);
//     console.log(srtF);
//     // console.log(output);

//     // Escape paths to avoid issues with spaces
//     const ffmpegCmd = `ffmpeg -y -i "C:/Users/KIIT0001/Desktop/Explified/Backend_Explified/functions/uploads/VID_20250710194533.mp4" -vf "subtitles='C\\:/Users/KIIT0001/Desktop/Explified/Backend_Explified/functions/uploads/VID_20250710194533.srt'" "C:/Users/KIIT0001/Desktop/Explified/Backend_Explified/functions/uploads/VID_20250710194533-subtitled.mp4"`;
//     // const ffmpegCmd = `ffmpeg -y -i "${input}" -vf subtitles="${srt}" "${output}"`;

//     // console.log("Running FFmpeg:", ffmpegCmd);

//     // Run FFmpeg
//     await new Promise((resolve, reject) => {
//       exec(ffmpegCmd, (error, stdout, stderr) => {
//         if (error) {
//           console.error("FFmpeg error:", stderr);
//           return reject(error);
//         }
//         console.log("FFmpeg done:", stdout);
//         resolve();
//       });
//     });

//     res.download(outputVideoPath);

//     res.status(201).json({
//       message: "Subtitle generated successfully",
//       content: genContent,
//       videoFile: outputVideoPath,
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     next(error);
//   }
// };
const generateSubtitle = async (req, res, next) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    const videoFile = req.files.video;
    const uploadDir = path.join(__dirname, "..", "uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save uploaded video
    const uploadPath = path.join(uploadDir, videoFile.name);
    await videoFile.mv(uploadPath);

    // Get SRT content from video
    const response = await fileUpload(uploadPath, req.files.video);
    const srtContent = await getContent(response);

    // if (!srtContent || srtContent.trim() === "") {
    //   return res.status(500).json({ error: "Generated subtitle is empty." });
    // }

    // // Write .srt file
    // const srtFilename = `${path.parse(videoFile.name).name}.srt`;
    // const srtPath = path.join(uploadDir, srtFilename);
    // fs.writeFileSync(srtPath, srtContent, "utf-8");

    // // Prepare final output path
    // const outputVideoPath = path.join(
    //   uploadDir,
    //   `${path.parse(videoFile.name).name}-subtitled.mp4`
    // );

    // // Use forward slashes for FFmpeg
    // const input = uploadPath.replace(/\\/g, "/");
    // const srt = srtPath.replace(/\\/g, "/");
    // const output = outputVideoPath.replace(/\\/g, "/");

    // // FFmpeg subtitle command (correct format)
    // const ffmpegCmd = `ffmpeg -y -i "${input}" -vf "subtitles='${srt}'" "${output}"`;

    // // Run FFmpeg
    // await new Promise((resolve, reject) => {
    //   exec(ffmpegCmd, (error, stdout, stderr) => {
    //     if (error) {
    //       console.error("FFmpeg error:", stderr);
    //       return reject(new Error("FFmpeg processing failed"));
    //     }
    //     console.log("FFmpeg success:", stdout);
    //     resolve();
    //   });
    // });

    // // Send file for download
    // res.download(outputVideoPath);

    res.status(201).json({
      message: "Subtitle generated successfully",
      content: srtContent,
      // videoFile: outputVideoPath,
    });
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
};

const changeSubtitleLanguage = async (req, res, next) => {
  try {
    const { language, text } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Change the language of this srt string to ${language}. Don't add or remove anything, just change the language. - ${text}`;
    const result = await model.generateContent(prompt);
    const genContent = result.response.text();

    res.status(201).json({
      message: "Subtitle generated successfully",
      content: genContent,
    });
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
};
const generateSynonyms = async (req, res, next) => {
  try {
    const { word } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Generate 5 synonyms of this word. Don't add anything else other than the synonyms.Synonyms should be in the same tense as the original word.- ${word}`;
    const result = await model.generateContent(prompt);
    const genContent = result.response.text();

    res.status(201).json({
      message: "Subtitle generated successfully",
      content: genContent,
    });
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
};

// const generateSubtitle = async (req, res, next) => {
//   try {
//     if (!req.files || !req.files.video) {
//       return res.status(400).json({ error: "No video uploaded" });
//     }

//     const videoFile = req.files.video;
//     const uploadDir = path.join(__dirname, "..", "uploads");

//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir);
//     }

//     const uploadPath = path.join(uploadDir, videoFile.name);

//     await videoFile.mv(uploadPath);

//     const response = await fileUpload(uploadPath, req.files.video); //we pass 'uploadPath' and the video file data to 'fileUpload'
//     const genContent = await getContent(response); //the 'response' (containing the file URI) is passed to 'getContent'

//     console.log("subs", genContent);

//     res.status(201).json({
//       message: "Subtitle generated successfully",
//       content: genContent,
//     });
//   } catch (error) {
//     console.error(
//       "Error:",
//       error.response ? error.response.data : error.message
//     );
//     throw error;
//   }
// };

module.exports = {
  generateSubtitle,
  changeSubtitleLanguage,
  generateSynonyms,
};
