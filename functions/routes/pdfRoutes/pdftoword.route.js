const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');

require('dotenv').config();
const pdftowordRouter = express.Router();


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}); 



// ConvertAPI configuration
const CONVERT_API_SECRET = process.env.CONVERT_API || 'your_secret_key_here';

pdftowordRouter.post('/convert', upload.single('pdf'), async (req, res) => {
  try {
    console.log('Starting conversion...');
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Create form data for ConvertAPI
    const formData = new FormData();
    formData.append('File', req.file.buffer, {
      filename: req.file.originalname || 'document.pdf',
      contentType: 'application/pdf'
    });

    // Construct the absolute URL properly
    const convertApiUrl = `https://v2.convertapi.com/convert/pdf/to/docx?Secret=${CONVERT_API_SECRET}`;
    
    console.log('Calling ConvertAPI...');

    // Call ConvertAPI with proper headers
    const response = await fetch(convertApiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders() // This is important for multipart/form-data
      }
    });

    console.log('ConvertAPI response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ConvertAPI error:', errorText);
      throw new Error(`ConvertAPI error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Conversion successful',result);

    res.json(result);
    
  } catch (error) {
    console.error('Conversion error:', error);
    
    // Send detailed error response
    res.status(500).json({ 
      error: 'Conversion failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


module.exports = pdftowordRouter;

