const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument: PDFLib } = require('pdf-lib');

const mergeRouter = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Endpoint to merge PDFs
mergeRouter.post('/merge-pdfs', upload.array('pdfs', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'At least 2 PDF files are required' });
    }

    // Create a new PDF document
    const mergedPdf = await PDFLib.create();

    // Process each uploaded PDF
    for (const file of req.files) {
      const pdfBytes = fs.readFileSync(file.path);
      const pdf = await PDFLib.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    // Generate the merged PDF
    const pdfBytes = await mergedPdf.save();
    
    // Create output filename
    const outputFilename = `merged-${Date.now()}.pdf`;
    const outputPath = path.join('uploads', outputFilename);
    
    // Save merged PDF
    fs.writeFileSync(outputPath, pdfBytes);

    // Clean up uploaded files
    req.files.forEach(file => {
      fs.unlinkSync(file.path);
    });

    // Send the merged PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.sendFile(path.resolve(outputPath));

    // Clean up merged file after sending (with delay)
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    }, 5000);

  } catch (error) {
    console.error('Error merging PDFs:', error);
    res.status(500).json({ error: 'Failed to merge PDFs' });
  }
});

module.exports = mergeRouter;