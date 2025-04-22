const express = require('express');
const router = express.router();
const multer = require('multer'); // middleware to handle file upload (img)


// Multer memory storage
const storage = multer.memoryStorage(); 
const upload = multer({ storage });

const {convertImageToCartoon} = require('../controllers/imageToCartoon');

router.post('/',upload.single('image'),convertImageToCartoon);


module.exports = router;
