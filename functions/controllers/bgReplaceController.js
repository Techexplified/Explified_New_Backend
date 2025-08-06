const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const { HfInference } = require("@huggingface/inference");

const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

const generateMask = async (imageBuffer) => {
  const image = sharp(imageBuffer);
  const { width, height } = await image.metadata();
  return await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer();
};

const generateAdvancedMask = async (imageBuffer) => {
  try {
    return await sharp(imageBuffer)
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
      })
      .threshold(50)
      .blur(1)
      .png()
      .toBuffer();
  } catch (e) {
    return await generateMask(imageBuffer);
  }
};

const inpaintImageHTTP = async (imageBuffer, maskBuffer, prompt) => {
  const formData = new FormData();
  formData.append("image", new Blob([imageBuffer], { type: "image/png" }));
  formData.append("mask", new Blob([maskBuffer], { type: "image/png" }));
  formData.append("prompt", prompt);
  formData.append("num_inference_steps", "30");
  formData.append("guidance_scale", "7.5");

  const res = await axios.post(
    "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting",
    formData,
    {
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        "Content-Type": "multipart/form-data",
      },
      responseType: "arraybuffer",
    }
  );

  return Buffer.from(res.data);
};

exports.replaceBackground = async (req, res) => {
  try {
    const { prompt, removeBackground } = req.body;
    const imageFile = req.files?.image?.[0];
    const templateFile = req.files?.template?.[0];

    if (!imageFile)
      return res.status(400).json({ error: "No image file provided" });

    if (!prompt && !templateFile)
      return res
        .status(400)
        .json({ error: "Either prompt or template must be provided" });

    let imageBuffer = imageFile.buffer;
    const { width, height } = await sharp(imageBuffer).metadata();

    if (width > 1024 || height > 1024) {
      imageBuffer = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: "inside" })
        .png()
        .toBuffer();
    }

    const mask = removeBackground === "true"
      ? await generateAdvancedMask(imageBuffer)
      : await generateMask(imageBuffer);

    const finalPrompt = templateFile
      ? "match the style and colors of the provided template"
      : prompt || "beautiful background, high quality";

    const resultBuffer = await inpaintImageHTTP(
      imageBuffer,
      mask,
      finalPrompt
    );

    const filename = `result_${Date.now()}.png`;
    const filepath = path.join("uploads", filename);
    await fs.writeFile(filepath, resultBuffer);

    res.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
      message: "Background replaced successfully",
    });
  } catch (err) {
    console.error("Inpainting error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.testMask = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file" });

    const maskBuffer = await generateAdvancedMask(req.file.buffer);
    const filename = `mask_${Date.now()}.png`;
    const filepath = path.join("uploads", filename);
    await fs.writeFile(filepath, maskBuffer);

    res.json({ success: true, maskUrl: `/uploads/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.healthCheck = (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
