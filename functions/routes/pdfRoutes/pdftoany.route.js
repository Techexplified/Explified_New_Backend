const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');

require('dotenv').config();

const pdftoanyRouter = express.Router();

// In-memory file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});


const CONVERT_API_SECRET = process.env.CONVERT_API || 'your_secret_key_here';

// No whitelist — allow all supported formats
pdftoanyRouter.post('/convert', upload.single('pdf'), async (req, res) => {
  try {
    const targetFormat = req.query.to;

    if (!targetFormat) {
      return res.status(400).json({ error: 'Missing target format' });
    }

    if (!req.file || req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const formData = new FormData();
    formData.append('File', req.file.buffer, {
      filename: req.file.originalname || 'document.pdf',
      contentType: 'application/pdf',
    });

    // For PNG, include PageRange to convert all pages
    if (targetFormat === 'png') {
      formData.append('PageRange', '1-2000');
    }

    const convertApiUrl = `https://v2.convertapi.com/convert/pdf/to/${targetFormat}?Secret=${CONVERT_API_SECRET}`;

    const response = await fetch(convertApiUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ConvertAPI error:', errorText);
      return res.status(500).json({ error: 'ConvertAPI failed', details: errorText });
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Conversion failed', details: error.message });
  }
});


module.exports = pdftoanyRouter;
