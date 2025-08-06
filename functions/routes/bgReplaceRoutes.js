const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  replaceBackground,
  testMask,
  healthCheck,
} = require("../controllers/bgReplaceController");

// multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"), false);
    }
  },
});

// Routes
router.get("/health", healthCheck);
router.post(
  "/replace",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "template", maxCount: 1 },
  ]),
  replaceBackground
);
router.post("/test-mask", upload.single("image"), testMask);

module.exports = router;
