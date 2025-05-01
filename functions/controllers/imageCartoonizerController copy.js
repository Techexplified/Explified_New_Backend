// const { db, mybucket } = require("../config/db");
// const ImageCartoonizer = require("../models/imageCartoonizerModel");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const { Readable } = require("stream");

// const collection = db.collection("imageCartoonizers");

exports.createCartoon = async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file || !type) {
      return res.status(400).json({ message: "image and type are required" });
    }
    const data = new FormData();
    const stream = Readable.from(file.buffer); // 🔁 use memory buffer
    data.append("image", stream, {
      filename: file.originalname || "image.jpg",
    });
    // data.append("image", fs.createReadStream(file.path));
    data.append("type", type);
    const options = {
      // origin: "https://explified-home.web.app",
      method: "POST",
      url: "https://cartoon-yourself.p.rapidapi.com/facebody/api/portrait-animation/portrait-animation",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "cartoon-yourself.p.rapidapi.com",
        ...data.getHeaders(),
      },
      data: data,
    };
    const response = await axios.request(options);
    // console.log(response.data);
    const cartoonImage = response?.data?.data?.image_url || "";

    // fs.unlink(file.path, (err) => {
    //   if (err) console.error("Failed to delete temp file:", err);
    //   else console.log("Temp file deleted:", file.path);
    // });

    // const newEntry = new ImageCartoonizer({ image, cartoonImage });
    // const docRef = await collection.add({ ...newEntry });
    res.status(201).json({
      message: "Image cartoonized successfully",
      data: cartoonImage,
      // id: docRef.id,
      // ...newEntry,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message, error: err });
  }
};
