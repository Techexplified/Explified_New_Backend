const fetch = require("node-fetch");
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

    const response = await fetch(
      "https://cartoon-yourself.p.rapidapi.com/facebody/api/portrait-animation/portrait-animation",
      {
        method: "POST",
        headers: {
          ...form.getHeaders(),
          "x-rapidapi-key": process.env.RAPID_API_KEY,
          "x-rapidapi-host": "cartoon-yourself.p.rapidapi.com",
        },
        body: form,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error: ${errorData}`);
    }

    const result = await response.json();
    const cartoonImage = result?.data?.image_url;

    res.status(201).json({
      message: "Image cartoonized successfully",
      data: cartoonImage,
    });
  } catch (err) {
    console.error("Cartoonizing failed:", err.message || err);
    res.status(500).json({
      message: "Cartoonizing failed",
      error: err.message || "Unknown error",
    });
  }
};
