const axios = require("axios");
const FormData = require("form-data");
const { Readable } = require("stream");

exports.createCartoon = async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file || !type) {
      return res.status(400).json({ message: "image and type are required" });
    }

    const data = new FormData();

    // Convert buffer to stream and append to form-data
    const stream = Readable.from(file.buffer);
    data.append("image", stream, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    data.append("type", type);

    const headers = {
      ...data.getHeaders(),
      "x-rapidapi-key": process.env.RAPID_API_KEY,
      "x-rapidapi-host": "cartoon-yourself.p.rapidapi.com",
    };

    const response = await axios.post(
      "https://cartoon-yourself.p.rapidapi.com/facebody/api/portrait-animation/portrait-animation",
      data,
      { headers }
    );

    const cartoonImage = response?.data?.data?.image_url || "";

    res.status(201).json({
      message: "Image cartoonized successfully",
      data: cartoonImage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: err.message || "Something went wrong",
    });
  }
};
