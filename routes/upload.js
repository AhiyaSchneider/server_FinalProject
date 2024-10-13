const express = require('express');
const multer = require('multer');
const { parseCSV, createOptimizedSchedule, saveScheduleToDB } = require('../utils/schedulerUtils');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

router.post('/', upload.fields([
    { name: 'demandFile', maxCount: 1 },
    { name: 'costFile', maxCount: 1 },
    { name: 'workersFile', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files) {
            return res.status(400).send('No files were uploaded.');
        }
        console.log("files uploaded");
        // Parse the CSV files
        const demandData = await parseCSV(req.files['demandFile'][0].path);
        const costData = await parseCSV(req.files['costFile'][0].path);
        const workersData = await parseCSV(req.files['workersFile'][0].path);
        console.log(demandData);
        console.log(costData);
        console.log(workersData);




        // Create optimized schedule
        const schedule = createOptimizedSchedule(demandData, costData, workersData);

        // Save schedule to the database
        await saveScheduleToDB(schedule);

        res.status(200).json({ message: 'Schedule created successfully', schedule });
        console.log(schedule);

    } catch (error) {

        console.error('Error uploading files:', error);
        res.status(500).send(`Error uploading files: ${error.message}`);
    }
});

module.exports = router;

