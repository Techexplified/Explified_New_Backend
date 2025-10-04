const express = require("express");
const { db } = require("../config/db");

const trainingRouter = express.Router();
const collectionRef = db.collection("training_modules");

// -------------------- POST (Create) --------------------
trainingRouter.post("/text", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text field is required." });
    }

    const newDoc = {
      text,
      createdAt: new Date(),
    };

    const docRef = await collectionRef.add(newDoc);

    return res.status(201).json({
      message: "✅ Text added successfully",
      id: docRef.id,
      data: newDoc,
    });
  } catch (err) {
    console.error("❌ Error adding text:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// -------------------- PATCH/PUT (Update) --------------------
trainingRouter.put("/text/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text field is required." });
    }

    const docRef = collectionRef.doc(id);
    await docRef.update({
      text,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      message: "✅ Text updated successfully",
      id,
      text,
    });
  } catch (err) {
    console.error("❌ Error updating text:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// -------------------- DELETE --------------------
trainingRouter.delete("/text/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await collectionRef.doc(id).delete();

    return res
      .status(200)
      .json({ message: "✅ Text deleted successfully", id });
  } catch (err) {
    console.error("❌ Error deleting text:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// -------------------- GET (Read All) --------------------
trainingRouter.get("/get/text", async (req, res) => {
  try {
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      return res.status(200).json({ message: "No texts found", data: [] });
    }

    const texts = [];
    snapshot.forEach((doc) => {
      texts.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({ data: texts });
  } catch (err) {
    console.error("❌ Error fetching texts:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = trainingRouter;
