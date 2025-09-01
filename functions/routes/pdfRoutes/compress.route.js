const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const convertapi = require('convertapi')(process.env.CONVERT_API);

const compressRouter = express.Router();

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

const uploadsDir = path.join(__dirname, 'uploads');
const compressedDir = path.join(__dirname, 'compressed');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(compressedDir)) {
  fs.mkdirSync(compressedDir, { recursive: true });
}

compressRouter.post('/compress-pdf', upload.single('file'), async (req, res) => {
  const uploadedFilePath = path.join(__dirname, 'uploads', req.file.filename + '.pdf');
  fs.renameSync(req.file.path, uploadedFilePath); // rename to ensure .pdf extension
  
  const originalSize = fs.statSync(uploadedFilePath).size;
  
  try {
    // Use the preset from frontend, fallback to 'web' if not provided
    const compressionPreset = req.body.preset || 'web';
    
    const result = await convertapi.convert('compress', {
      File: uploadedFilePath,
      Preset: compressionPreset,
    }, 'pdf');
    
    const downloadUrl = result.response.Files[0].Url;
    
    // Clean up uploaded file
    fs.unlinkSync(uploadedFilePath);
    
    res.json({ 
      downloadUrl,
      originalSize,
      message: 'PDF compressed successfully'
    });
    
  } catch (error) {
    console.error('Compression error:', error);
    
    // Clean up uploaded file in case of error
    if (fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
    
    res.status(500).json({ error: 'Failed to compress PDF' });
  }
});


module.exports = compressRouter;