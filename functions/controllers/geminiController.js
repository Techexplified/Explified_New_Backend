const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


exports.contentForPresentation = async (req, res) => {
  try {
    const { topic , slideCount } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Missing topic" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // or "gemini-1.5-flash-latest"

    const prompt = ` Generate a presentation structure in JSON format for the topic: "${topic}".There should be ${slideCount} slides. Each slide should include a title and 6-7 bullet points. The format must be compatible with the PptxGenJS JavaScript library, where slides are an array of objects with 'title' and 'bulletPoints' keys. Keep bullet points short and informative. let me give you example of how you should return response, this is an example of response when topic was photosynthesis, response : {   "title": "Photosynthesis",   "slides": [     {       "title": "Introduction",       "bulletPoints": [         "Photosynthesis is how plants convert light energy into chemical energy.",         "It provides energy for ecosystems and releases oxygen."       ]     },     {       "title": "Conversion of Light Energy",       "bulletPoints": [         "Chlorophyll absorbs sunlight to start photosynthesis.",         "Light energy is transformed into chemical energy."       ]     },     {       "title": "Inputs and Outputs",       "bulletPoints": [         "Inputs: carbon dioxide and water.",         "Outputs: glucose and oxygen."       ]     },     {       "title": "Two Main Stages",       "bulletPoints": [         "Light-dependent reactions create ATP and NADPH.",         "The Calvin cycle produces glucose using chemical energy."       ]     },     {       "title": "Role of Chloroplasts",       "bulletPoints": [         "Photosynthesis occurs in chloroplasts.",         "Thylakoids handle light reactions; stroma handles the Calvin cycle."       ]     },     {       "title": "Environmental Factors",       "bulletPoints": [         "Photosynthesis is affected by light, CO₂, and temperature.",         "Optimal conditions increase photosynthetic rate."       ]     },     {       "title": "Importance for Life",       "bulletPoints": [         "Forms the base of most food chains.",         "Oxygen released is vital for aerobic organisms."       ]     }   ] }`;
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Step 1: Clean it up
    const cleaned = content.replace(/```json\n?/, "").replace(/```$/, "");

    // Step 2: Parse to JSON
    const pptData = JSON.parse(cleaned);
    
    res.status(201).json({
      message: "Content generated successfully",
      pptData,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Failed to generate content",
      details: error.message || "Unknown error",
    });
  }
};


exports.imageForPresentation = async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");

    res.json({ base64: `data:image/png;base64,${base64Image}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}