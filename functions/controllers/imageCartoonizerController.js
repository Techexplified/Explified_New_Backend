const axios = require("axios");
const FormData = require("form-data");

exports.createCartoon = async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file || !type) {
      return res.status(400).json({ message: "image and type are required" });
    }

    console.log(file);
    console.log("Received file buffer size:", file.buffer?.length);

    const form = new FormData();
    form.append("image", file.buffer, {
      filename: file.originalname || "image.jpg",
      contentType: file.mimetype || "image/jpeg",
    });
    form.append("type", type);

    const response = await axios.post(
      "https://cartoon-yourself.p.rapidapi.com/facebody/api/portrait-animation/portrait-animation",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "x-rapidapi-key": process.env.RAPID_API_KEY,
          "x-rapidapi-host": "cartoon-yourself.p.rapidapi.com",
        },
        maxBodyLength: Infinity, // 🚀 important for large uploads
      }
    );

    const cartoonImage = response?.data?.data?.image_url;

    res.status(201).json({
      message: "Image cartoonized successfully",
      data: cartoonImage,
    });
  } catch (err) {
    console.error(err?.response?.data || err.message || err);
    res.status(500).json({
      message: "Cartoonizing failed",
      error: err?.response?.data || err.message || err,
    });
  }
};
