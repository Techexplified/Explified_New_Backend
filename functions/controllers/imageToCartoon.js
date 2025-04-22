const { db, bucket } = require('../config/db');
const express = require('express');

const convertImageToCartoon = async (req, res) => {
    try {

        const file = req.file;
        console.log(file);
        // console.log(file);
        // const blob = bucket.file(Date.now() + '-' + file.originalname);
        // const blobStream = blob.createWriteStream({
        //     metadata: {
        //         contentType: file.mimetype
        //     }
        // });

        // blobStream.on('error', (err) => {
        //     res.status(500).json({
        //         status: false,
        //         error: err
        //     })
        // });

        // blobStream.on('finish', async () => {
        //     // Make public and get URL
        //     await blob.makePublic();
        //     const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        //     res.status(200).json({ url: publicUrl });
        // });

        // blobStream.end(file.buffer);

        res.json(
            { status: true }
        );

    } catch (error) {
        res.status(404).json({
            status: false,
            error: error
        });

    }
}

module.exports = { convertImageToCartoon };