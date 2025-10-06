const axios = require("axios");

const generateGIFId = async (req, res, next) => {
  const { prompt } = req.body;

  console.log(prompt);

  try {
    const response = await axios.post(
      "https://api.magichour.ai/v1/ai-gif-generator",
      {
        name: "Ai Gif gif",
        style: { prompt },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MAGIC_HOUR_API_KEY_SARITA}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response?.data);
    const responseID = response?.data?.id;

    res.status(201).json({
      message: "GIF generated successfully",
      content: responseID,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
};

const generateGIF = async (req, res, next) => {
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
      message: "GIF generated successfully",
      content: responseUrl,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    console.log(err);
  }
};

module.exports = { generateGIFId, generateGIF };
