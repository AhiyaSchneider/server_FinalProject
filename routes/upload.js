const express = require('express');
const router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Keep the original file name
    }
});

const upload = multer({ storage: storage });

router.post('/', upload.fields([
    { name: 'demandFile', maxCount: 1 },
    { name: 'costFile', maxCount: 1 },
    { name: 'workersFile', maxCount: 1 }
]), (req, res) => {
    try {
        if (!req.files) {
            return res.status(400).send('No files were uploaded.');
        }
        console.log('Files received:', req.files);
        res.status(200).send('Files uploaded successfully');
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).send(`Error uploading files: ${error.message}`);
    }
});

module.exports = router;
