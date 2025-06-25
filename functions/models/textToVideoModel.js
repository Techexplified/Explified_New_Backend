class TextToVideo {
  constructor({ prompt, videoUrl }) {
    this.prompt = prompt;
    this.videoUrl = videoUrl;
    this.createdAt = new Date();
  }
}

module.exports = TextToVideo;
