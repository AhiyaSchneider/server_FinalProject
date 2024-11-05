const express = require('express');
const fs = require('fs');
const multer = require('multer');
const { parseCSV, createOptimizedSchedule, saveScheduleToDB } = require('../utils/schedulerUtils');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

router.post(
    '/',
    upload.fields([
        { name: 'demandFile', maxCount: 1 },
        { name: 'costFile', maxCount: 1 },
        { name: 'workersFile', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            if (!req.files) {
                return res.status(400).send('No files were uploaded.');
            }
            console.log("Files uploaded");

            // Parse CSV files
            const demandData = await parseCSV(req.files['demandFile'][0].path);
            const costData = await parseCSV(req.files['costFile'][0].path);
            const workersData = await parseCSV(req.files['workersFile'][0].path);

            const username = req.body.username;
            if (!username) {
                return res.status(400).send('Username is required.');
            }

            console.log("Username:", username);
            console.log("Demand data:", demandData);
            console.log("Cost data:", costData);
            console.log("Workers data:", workersData);

            // Create optimized schedule
            const scheduleArray = createOptimizedSchedule(demandData, costData, workersData);

            // Save schedule to the database
            await saveScheduleToDB(scheduleArray, username);

            res.status(200).json({ message: 'Schedule created successfully', schedule: scheduleArray });
            console.log("Schedule saved:", scheduleArray);

        } catch (error) {
            console.error('Error uploading files:', error);
            res.status(500).send(`Error uploading files: ${error.message}`);
        }
    }
);

module.exports = router;
