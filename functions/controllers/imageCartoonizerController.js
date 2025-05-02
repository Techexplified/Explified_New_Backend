const axios = require("axios");

exports.createCartoon = async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file || !type) {
      return res.status(400).json({ message: "Image and type are required" });
    }

    console.log("Received file buffer size:", file.buffer?.length);

    // Convert image buffer to base64 string
    const base64Image = file.buffer.toString("base64");

    // Prepare x-www-form-urlencoded body
    const encodedParams = new URLSearchParams();
    encodedParams.append("image", base64Image);
    encodedParams.append("type", type);

    const response = await axios.post(
      "https://cartoon-yourself.p.rapidapi.com/facebody/api/portrait-animation/portrait-animation",
      encodedParams,
      {
        headers: {
          "x-rapidapi-key": process.env.RAPID_API_KEY,
          "x-rapidapi-host": "cartoon-yourself.p.rapidapi.com",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const cartoonImage = response?.data?.data?.image_url;

    res.status(201).json({
      message: "Image cartoonized successfully",
      data: cartoonImage,
    });
  } catch (err) {
    console.error(
      "Cartoonize Error:",
      err?.response?.data || err.message || err
    );
    res.status(500).json({
      message: "Cartoonizing failed",
      error: err?.response?.data || err.message || err,
    });
  }
};
