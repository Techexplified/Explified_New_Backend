const express = require("express");
const { mybucket: bucket } = require("../../config/db");
const fileUpload = express.Router();
// ...existing code...

fileUpload.get("/uploads", async (req, res) => {
  try {
    const [files] = await bucket.getFiles({ prefix: "excel_uploads/" });
    const fileList = await Promise.all(
      files.map(async (file) => {
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "03-01-2030",
        });
        return {
          name: file.name.replace("excel_uploads/", ""),
          url,
        };
      })
    );
    res.status(200).json({ files: fileList });
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Error fetching uploaded files" });
  }
});

// ...existing code...

fileUpload.post("/upload", async (req, res) => {
  const uploadedFile = req.files?.file || req.files?.File;
  if (!req.files || !uploadedFile) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/vnd.ms-excel",
  ];

  if (!allowedTypes.includes(uploadedFile.mimetype)) {
    return res
      .status(400)
      .json({ error: "Invalid file type. Only .csv and .xlsx allowed." });
  }

  const destination = `excel_uploads/${Date.now()}_${uploadedFile.name}`;
  const firebaseFile = bucket.file(destination);

  try {
    await firebaseFile.save(uploadedFile.data, {
      metadata: {
        contentType: uploadedFile.mimetype,
      },
    });

    const [url] = await firebaseFile.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    return res.status(200).json({
      message: "File uploaded successfully",
      fileUrl: url,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Error uploading file" });
  }
});

module.exports = fileUpload;
  