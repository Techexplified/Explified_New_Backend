const express = require("express");
const { db } = require("../config/db");

const salesRouter = express.Router();

salesRouter.post("/contact/details", async (req, res) => {
  try {
    const dataArray = req.body;

    // Validate that the body is a non-empty array
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return res
        .status(400)
        .json({ error: "Request body must be a non-empty array." });
    }

    const firstItem = dataArray[0];

    if (!firstItem.JSON || typeof firstItem.JSON !== "object") {
      return res
        .status(400)
        .json({ error: "Missing or invalid JSON field in request body." });
    }

    const { name, email, phone, preferred_time } = firstItem.JSON;

    // Create the lead object
    const lead = {
      name: name || "",
      emailId: email || "",
      phoneNumber: phone || "",
      preferredContactTime: preferred_time || "",
      createdAt: new Date(),
    };

    const docRef = await db.collection("sales_leads").add(lead);

    console.log("✅ Lead saved:", JSON.stringify(lead, null, 2));

    // Respond with success
    return res.status(200).json({
      message: "✅ Lead saved successfully.",
      id: docRef.id,
      data: lead,
    });
  } catch (error) {
    console.error("❌ Error saving lead:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

salesRouter.get("/get/contact/details", async (req, res) => {
  try {
    const snapshot = await db.collection("sales_leads").get();

    if (snapshot.empty) {
      return res
        .status(200)
        .json({ message: "No sales leads found.", data: [] });
    }

    const leads = [];

    snapshot.forEach((doc) => {
      leads.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({ data: leads });
  } catch (error) {
    console.error("❌ Error fetching leads:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = salesRouter;
