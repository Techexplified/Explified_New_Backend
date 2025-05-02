const axios = require("axios");
const FormData = require("form-data");

exports.createCartoon = async (req, res) => {
  try {
    // req.file comes from multer middleware
    const file = req.file;
    const type = req.body.type;

    if (!file || !type) {
      return res.status(400).json({
        message: "Image file and type are required",
      });
    }

    // Create FormData for the RapidAPI request
    const form = new FormData();
    form.append("image", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    form.append("type", type);

    const response = await axios.post(
      "https://cartoon-yourself.p.rapidapi.com/facebody/api/portrait-animation/portrait-animation",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "x-rapidapi-key":
            "a5a377b732msh8e36ae5b233ad40p11e12ejsn844dbae5f2cc",
          "x-rapidapi-host": "cartoon-yourself.p.rapidapi.com",
        },
      }
    );

    const cartoonImage = response?.data?.data?.image_url;

    res.status(201).json({
      message: "Image cartoonized successfully",
      data: cartoonImage,
    });
  } catch (err) {
    console.error("Cartoonize Error:", err?.response?.data || err.message);
    res.status(500).json({
      message: "Cartoonizing failed",
      error: err?.response?.data || err.message,
    });
  }
};
