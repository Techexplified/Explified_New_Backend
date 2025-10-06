const axios = require("axios");

const generateVideoFromImage = async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image)
      return res.status(400).json({
        message: "Image file is required",
      });

    const options = {
      method: "POST",
      url: "https://runwayml.p.rapidapi.com/generate/image",
      headers: {
        "x-rapidapi-key": "5c43358bb7msh620384fe8a16560p1a0fd1jsn853ee75f7459",
        "x-rapidapi-host": "runwayml.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      data: {
        img_prompt: image,
        model: "gen3",
        image_as_end_frame: false,
        flip: false,
        motion: 5,
        seed: 0,
        callback_url: "",
        time: 5,
      },
    };

    const response = await axios.request(options);
    console.log(response?.data);
    const uuid = response?.data?.uuid;

    res.status(201).json({
      message: "Subtitle generated successfully",
      uuid,
    });
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
};

module.exports = {
  generateVideoFromImage,
};
