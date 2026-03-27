const {
  GoogleAIFileManager,
  FileState,
} = require("@google/generative-ai/server");
// const { configDotenv } = require("dotenv");
// configDotenv();

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY); //create a new GoogleAIFileManager instance

async function fileUpload(path, videoData) {
  try {
    const uploadResponse = await fileManager.uploadFile(path, {
      mimeType: videoData.mimetype,
      displayName: videoData.name,
    });
    const name = uploadResponse.file.name;
    let file = await fileManager.getFile(name);
    while (file.state === FileState.PROCESSING) {
      //check the state of the file
      process.stdout.write(".");
      await new Promise((res) => setTimeout(res, 10000)); //check every 10 second
      file = await fileManager.getFile(name);
    }
    if (file.state === FileState.FAILED) {
      throw new Error("Video processing failed");
    }
    return file; // return the file object, containing the upload file information and the uri
  } catch (error) {
    throw error;
  }
}

module.exports = { fileUpload, fileManager };
