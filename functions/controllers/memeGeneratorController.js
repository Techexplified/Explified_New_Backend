const axios = require("axios");

const generateMemeId = async (req, res, next) => {
  const { topic, template } = req.body;

  console.log(topic);

  try {
    const response = await axios.post(
      "https://api.magichour.ai/v1/ai-meme-generator",
      JSON.stringify({
        name: "My Funny Meme",
        style: {
          topic,
          template,
          searchWeb: false,
        },
      }),
      {
        headers: {
          Authorization: `Bearer ${process.env.MAGIC_HOUR_API_KEY_SARITA}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseID = response?.data?.id;

    res.status(201).json({
      message: "Meme generated successfully",
      content: responseID,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      message: "Failed to generate meme",
      error: err.response?.data || err.message,
    });
  }
};

const generateMeme = async (req, res, next) => {
  const { uid } = req.body;

  try {
    const response = await axios.get(
      `https://api.magichour.ai/v1/image-projects/${uid}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MAGIC_HOUR_API_KEY_SARITA}`,
        },
      }
    );

    console.log(response?.data);
    const responseUrl = response?.data?.downloads[0].url;

    res.status(201).json({
      message: "Meme generated successfully",
      content: responseUrl,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    console.log(err);
  }
};

module.exports = { generateMemeId, generateMeme };
