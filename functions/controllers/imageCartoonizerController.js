// const { db, mybucket } = require("../config/db");
// const ImageCartoonizer = require("../models/imageCartoonizerModel");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// const collection = db.collection("imageCartoonizers");

exports.createCartoon = async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    console.log(file);

    if (!file || !type) {
      return res.status(400).json({ message: "image and type are required" });
    }

    // Extract the image data
    // const matches = image.match(/^data:(.+);base64,(.+)$/);
    // if (!matches || matches.length !== 3) {
    //   return res.status(400).json({ error: "Invalid base64 format" });
    // }

    // const buffer = Buffer.from(matches[2], "base64");
    // const mimeType = matches[1];
    // const extension = mimeType.split("/")[1];
    // const fileName = `images/${Date.now()}.${extension}`;
    // const file = mybucket.file(fileName);

    // await file.save(buffer, {
    //   metadata: {
    //     contentType: mimeType,
    //   },
    //   public: true,
    // });

    // const imageUrl = `https://storage.googleapis.com/${mybucket.name}/${fileName}`;

    const data = new FormData();
    data.append("image", fs.createReadStream(file.path));
    data.append("type", type);

    const options = {
      origin: "https://explified-home.web.app",
      method: "POST",
      url: "https://cartoon-yourself.p.rapidapi.com/facebody/api/portrait-animation/portrait-animation",
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "cartoon-yourself.p.rapidapi.com",
        ...data.getHeaders(),
      },
      data: data,
    };

    const response = await axios.request(options);
    // console.log(response.data);

    const cartoonImage = response?.data?.data?.image_url || "";

    fs.unlink(file.path, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
      else console.log("Temp file deleted:", file.path);
    });

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
    res.status(500).json({ error: err.message });
  }
};
