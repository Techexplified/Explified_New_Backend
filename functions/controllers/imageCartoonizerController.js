const axios = require("axios");

exports.createCartoon = async (req, res) => {
  try {
    const { image, type } = req.body;

    if (!image || !type) {
      return res
        .status(400)
        .json({ message: "base64Image and type are required" });
    }

    const encodedParams = new URLSearchParams();
    encodedParams.append("image", image);
    encodedParams.append("type", type);

    const options = {
      method: "POST",
      url: "https://cartoon-yourself.p.rapidapi.com/facebody/api/portrait-animation/portrait-animation",
      headers: {
        "x-rapidapi-key": "a5a377b732msh8e36ae5b233ad40p11e12ejsn844dbae5f2cc",
        "x-rapidapi-host": "cartoon-yourself.p.rapidapi.com",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: encodedParams,
    };

    const response = await axios.request(options);
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
