const axios = require("axios");
const fs = require("fs");
const fsPromises = require("fs/promises");
const FormData = require("form-data");


const removeBackground = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = req.file.path;

    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath)); // <-- this must match what the API expects

    const {data} = await axios.post(
      'https://background-removal4.p.rapidapi.com/v1/results?mode=fg-image',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'background-removal4.p.rapidapi.com',
        },
        responseType: 'arraybuffer', // for binary image
      }
    );

    fs.unlinkSync(imagePath); // cleanup

    res.type("png").send(data);

  } catch (error) {
    const buffer = error.response?.data;
    console.error('❌ Error:', buffer?.toString() || error.message);
    res.status(500).json({ error: 'Failed to remove background' });
  }
};



const blurBackground = async (req, res) => {
  if (!req.file) return res.status(400).send("No image uploaded.");

  const radius = Math.max(1, Math.min(100, Number(req.body.radius) || 10));

  const form = new FormData();
  form.append("radius", radius);
  form.append("image", fs.createReadStream(req.file.path));

  try {
    const { data } = await axios.post(
      "https://ai-background-remover.p.rapidapi.com/image/blur/v1",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "ai-background-remover.p.rapidapi.com",
        },
        responseType: "arraybuffer",
      }
    );

    res.type("png").send(data);
  } catch (err) {
    console.error("Pixelcut replied:", err.response?.data || err.message);
    res
      .status(err.response?.status || 500)
      .send(err.response?.data || "Error processing image");
  } finally {
    fsPromises.unlink(req.file.path).catch(console.error);
  }
};

// const generateBackground = async (req, res) => {
//   const { prompt } = req.body;
//   const file = req.file;

//   if (!file || !prompt) {
//     return res.status(400).json({ error: 'Image and prompt are required' });
//   }

//   const form = new FormData();
//   form.append('image', fs.createReadStream(file.path));
//   form.append('prompt', prompt);

//   try {
//     const response = await axios.post(
//       'https://ai-background-remover.p.rapidapi.com/image/generate/v1',
//       form,
//       {
//         headers: {
//           ...form.getHeaders(),
//           'x-rapidapi-key': process.env.RAPIDAPI_KEY,
//           'x-rapidapi-host': 'ai-background-remover.p.rapidapi.com',
//         },
//         maxBodyLength: Infinity,
//       }
//     );

//     // Remove temp uploaded image
//     fs.unlinkSync(file.path);

//     res.json(response.data);
//   } catch (error) {
//     console.error('API Error:', error.response?.data || error.message);
//     res.status(500).json({ error: 'Failed to generate background' });
//   }
// };

const replaceWithColor = async (req, res) => {
  const { color } = req.body;
  const file = req.file;

  if (!file || !color) {
    return res.status(400).json({ error: "Image and color are required" });
  }

  // Convert HEX color to RGBA
  const hex = color.startsWith("#") ? color.slice(1) : color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = 255;

  const form = new FormData();
  form.append("image", fs.createReadStream(file.path));
  // ✅ Proper format: raw string, NOT JSON.stringify
  form.append("bgcolor", `${r},${g},${b},${a}`);

  try {
    const response = await axios.post(
      "https://ai-background-remover.p.rapidapi.com/image/color/v1",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "ai-background-remover.p.rapidapi.com",
        },
        responseType: "arraybuffer",
      }
    );

    res.type("png").send(response.data);
  } catch (error) {
    const errorMsg = Buffer.isBuffer(error.response?.data)
      ? error.response.data.toString()
      : error.response?.data || error.message;

    console.error("Color BG API Error:", errorMsg);
    res.status(500).json({ error: "Failed to replace background with color" });
  } finally {
    fs.unlinkSync(file.path);
  }
};

const replaceWithGradient = async (req, res) => {
  const { color1, color2 } = req.body;
  const file = req.file;

  if (!file || !color1 || !color2) {
    return res
      .status(400)
      .json({ error: "Image and both gradient colors are required" });
  }

  const form = new FormData();
  form.append("image", fs.createReadStream(file.path));
  form.append("hexColor1", color1);
  form.append("hexColor2", color2);

  try {
    const response = await axios.post(
      "https://ai-background-remover.p.rapidapi.com/image/gradient/v1",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "ai-background-remover.p.rapidapi.com",
        },
        maxBodyLength: Infinity,
      }
    );

    fs.unlinkSync(file.path);
    res.json(response.data);
  } catch (error) {
    console.error(
      "Gradient BG API Error:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ error: "Failed to replace background with gradient" });
  }
};

module.exports = {
  blurBackground,
  removeBackground,
  // generateBackground,
  replaceWithColor,
  replaceWithGradient,
};
