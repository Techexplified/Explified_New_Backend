const { db } = require("../config/db");
const TextToVideo = require("../models/textToVideoModel");

const collection = db.collection("textToVideos");

exports.createTextToVideo = async (req, res) => {
  try {
    const { prompt } = req.body;
    const videoUrl = "";
    const newEntry = new TextToVideo({ prompt, videoUrl });
    const docRef = await collection.add({ ...newEntry });
    res.status(201).json({
      message: "Video created successfully",
      id: docRef.id,
      ...newEntry,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Video creation failed", error: err.message });
  }
};

exports.getAllTextToVideos = async (req, res) => {
  try {
    const snapshot = await collection.orderBy("createdAt", "desc").get();
    const results = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        prompt: data.prompt,
        videoUrl: data.videoUrl,
        createdAt: data.createdAt.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
      };
    });
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
