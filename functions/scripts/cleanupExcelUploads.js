const { mybucket: bucket } = require("../config/db");

async function cleanupExcelUploads() {
  const [files] = await bucket.getFiles({ prefix: "excel_uploads/" });
  const keepFile = "excel_uploads/latest_uploaded_file.xlsx"; // Change as needed

  for (const file of files) {
    if (file.name !== keepFile) {
      try {
        await file.delete();
        console.log(`Deleted: ${file.name}`);
      } catch (err) {
        console.error(`Error deleting ${file.name}:`, err.message);
      }
    }
  }
  console.log("Cleanup complete.");
}

cleanupExcelUploads();