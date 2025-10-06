const axios = require("axios");

const removeBackground = async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        message: "Image file is required",
      });
    }

    const response = await axios.post(
      "https://api.withoutbg.com/v1.0/image-without-background-base64",
      {
        image_base64: image,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "key-MD8xiiHGyABNddZA",
        },
      }
    );
    console.log(response?.data);

    const bgImage = response?.data?.img_without_background_base64 || "";

    res.status(201).json({
      message: "Bg removed successfully",
      data: bgImage,
    });
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

module.exports = { removeBackground };
