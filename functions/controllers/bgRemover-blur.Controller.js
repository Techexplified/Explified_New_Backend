const axios = require("axios");
const fs = require("fs");
const fsPromises = require("fs/promises");
const FormData = require("form-data");

export const removeBackground = async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("image", fs.createReadStream(req.file.path));

    const response = await axios.post(
      "https://ai-background-remover.p.rapidapi.com/image/matte/v1",
      formData,
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "ai-background-remover.p.rapidapi.com",
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer",
      }
    );

    fs.unlinkSync(req.file.path);
    res.set("Content-Type", "image/png");
    res.send(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Background removal failed" });
  }
};

export const blurBackground = async (req, res) => {
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
