const express = require("express");
const { mybucket: bucket } = require("../../config/db");
const fileUpload = express.Router();
const csv = require("csvtojson");
const XLSX = require("xlsx");
const { IncomingForm } = require("formidable");
const fs = require("fs/promises");
const os = require("os");
const cloudinary = require("cloudinary").v2;
const https = require("https");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("📋 Cloudinary config check:");
console.log(
  "Cloud Name:",
  process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing"
);
console.log(
  "API Key:",
  process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing"
);
console.log(
  "API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing"
);

// Helper function to download file from URL
const downloadFile = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download file. Status: ${response.statusCode}`)
          );
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      })
      .on("error", reject);
  });
};

fileUpload.get("/uploads", async (req, res) => {
  try {
    console.log("📥 Retrieving uploaded file...");

    // Since we always upload with the same public_id, we can construct the URL directly
    // Try both CSV and XLSX formats since we don't know which was uploaded last
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const csvUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/excel_uploads/latest_uploaded_file.csv`;
    const xlsxUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/excel_uploads/latest_uploaded_file.xlsx`;

    let buffer;
    let isCSV = true;

    try {
      console.log("  Trying CSV format...");
      buffer = await downloadFile(csvUrl);
      console.log("✅ Found CSV file");
    } catch (csvError) {
      try {
        console.log("🔍 Trying XLSX format...");
        buffer = await downloadFile(xlsxUrl);
        isCSV = false;
        console.log("✅ Found XLSX file");
      } catch (xlsxError) {
        console.log("❌ No file found in either format");
        return res.status(404).json({ error: "No file found" });
      }
    }

    let content;
    if (isCSV) {
      console.log("📊 Parsing as CSV...");
      content = await csv().fromString(buffer.toString());
    } else {
      console.log("📊 Parsing as XLSX...");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      content = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    // Return only the content
    res.status(200).json(content);
  } catch (err) {
    console.error("❌ Error fetching file content:");
    console.error("Error message:", err.message);
    res
      .status(500)
      .json({ error: "Error fetching file content", details: err.message });
  }
});

// Upload and replace the file, delete all others, return its content
fileUpload.post("/upload", async (req, res) => {
  console.log("🚀 Upload route hit - checking middleware interference");
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Method:", req.method);
  console.log("Body already parsed?", req.body !== undefined ? "YES" : "NO");

  const form = new IncomingForm({
    uploadDir: os.tmpdir(),
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    multiples: false,
  });

  console.log("📝 Starting Formidable parse...");

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
    console.log("✅ Form parsed successfully!");
    console.log("Files found:", Object.keys(files));
  } catch (err) {
    console.error("❌ Form parse error:", err.message);
    return res
      .status(400)
      .json({ error: "Error parsing form: " + err.message });
  }

  const uploadedFile = files.file?.[0] || files.File?.[0];
  if (!uploadedFile) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("📁 File details:");
  console.log("Original filename:", uploadedFile.originalFilename);
  console.log("MIME type:", uploadedFile.mimetype);
  console.log("Size:", uploadedFile.size);

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/csv",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
  ];

  // Also check file extension as fallback
  const filename = uploadedFile.originalFilename || "";
  const isCSV = filename.toLowerCase().endsWith(".csv");
  const isXLSX =
    filename.toLowerCase().endsWith(".xlsx") ||
    filename.toLowerCase().endsWith(".xls");

  if (!allowedTypes.includes(uploadedFile.mimetype) && !isCSV && !isXLSX) {
    // Clean up temp file
    try {
      await fs.unlink(uploadedFile.filepath);
    } catch (unlinkErr) {
      console.error("Error deleting temp file:", unlinkErr);
    }
    return res
      .status(400)
      .json({ error: "Invalid file type. Only .csv and .xlsx allowed." });
  }

  try {
    console.log("Uploading file to Cloudinary:", uploadedFile.originalFilename);

    // Determine file extension and resource type
    const fileExtension = uploadedFile.originalFilename
      .split(".")
      .pop()
      .toLowerCase();
    const resourceType = fileExtension === "csv" ? "raw" : "raw"; // Use 'raw' for both CSV and Excel files

    // Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(
      uploadedFile.filepath,
      {
        folder: "excel_uploads",
        public_id: `latest_uploaded_file`,
        resource_type: resourceType,
        format: fileExtension,
        overwrite: true, // This will replace the existing file
        invalidate: true, // Invalidate CDN cache
        use_filename: true,
        unique_filename: false,
      }
    );

    console.log(
      "File uploaded to Cloudinary successfully:",
      cloudinaryResult.secure_url
    );

    // Read file content for parsing
    let buffer;
    try {
      buffer = await fs.readFile(uploadedFile.filepath);
    } catch (readErr) {
      console.error("Error reading temp file:", readErr);
      return res.status(500).json({ error: "Error reading uploaded file" });
    }

    // Parse the uploaded file content
    let fileContent;
    if (
      isCSV ||
      uploadedFile.mimetype === "text/csv" ||
      uploadedFile.mimetype === "text/plain"
    ) {
      // Parse CSV
      console.log("Parsing CSV file");
      fileContent = await csv().fromString(buffer.toString());
    } else if (isXLSX) {
      // Parse XLSX
      console.log("Parsing XLSX file");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      fileContent = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    console.log("File parsed successfully, rows:", fileContent?.length || 0);

    // Return only the file content
    return res.status(200).json(fileContent);
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Error uploading file" });
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(uploadedFile.filepath);
      console.log("Temp file cleaned up");
    } catch (unlinkErr) {
      console.error("Error deleting temp file:", unlinkErr);
    }
  }
});

module.exports = fileUpload;
