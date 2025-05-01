const axios = require("axios");
const FormData = require("form-data");

exports.createCartoon = async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file || !type) {
      return res.status(400).json({ message: "image and type are required" });
    }

    const data = new FormData();

    // 🔧 Append the buffer directly
    data.append("image", file.buffer, {
      filename: file.originalname || "image.jpg",
      contentType: file.mimetype || "image/jpeg",
    });

    data.append("type", type);

    // const headers = {
    //   ...data.getHeaders(),
    //   "x-rapidapi-key": process.env.RAPID_API_KEY,
    //   "x-rapidapi-host": "cartoon-yourself.p.rapidapi.com",
    // };

    // const response = await axios.post(
    //   "https://cartoon-yourself.p.rapidapi.com/facebody/api/portrait-animation/portrait-animation",
    //   data,
    //   { headers }
    // );

    // const cartoonImage = response?.data?.data?.image_url || "";

    res.status(201).json({
      message: "Image cartoonized successfully",
      data: {
        file: file,
        data: data,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Unexpected server error",
      error: err,
    });
  }
};
