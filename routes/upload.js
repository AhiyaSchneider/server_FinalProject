const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { parseCSV, createOptimizedSchedule, saveScheduleToDB } = require('../utils/schedulerUtils');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Path to the temporary JSON file for storing the uploadedFiles state
const tempFilePath = path.join(__dirname, '../uploads/uploadedFiles.json');

// Load the state from the temporary file if it exists
let uploadedFiles = {};
if (fs.existsSync(tempFilePath)) {
    const data = fs.readFileSync(tempFilePath);
    uploadedFiles = JSON.parse(data);
    console.log('Loaded initial uploadedFiles state:', uploadedFiles);
}

// Function to save the state to the temporary file
const saveUploadedFilesState = () => {
    fs.writeFileSync(tempFilePath, JSON.stringify(uploadedFiles, null, 2));
    console.log('Saved uploadedFiles state:', uploadedFiles);
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// POST route for single or multiple file uploads
router.post('/', upload.fields([
    { name: 'demandFile', maxCount: 1 },
    { name: 'costFile', maxCount: 1 },
    { name: 'workersFile', maxCount: 1 }
]), async (req, res) => {
    try {
        let username = req.body.username;

        // If username is not provided, try to use a previously saved username
        if (!username) {
            console.log('Username not provided in the request, attempting to use a saved username.');
            console.log('check uploadedFiles state when no username provided:', uploadedFiles);

            const userEntries = Object.entries(uploadedFiles).find(
                ([user, files]) =>
                    files.demandFile && files.costFile && files.workersFile // Check if all files are present
            );

            if (userEntries) {
                username = userEntries[0];
                console.log(`Reusing saved username: ${username}`);
            } else {
                console.log('No saved username found. Username is required.');
                return res.status(400).send('Username is required.');
            }
        } else {
            console.log(`Username provided in the request: ${username}`);
        }

        // Initialize tracking for the user's uploaded files if not already done
        if (!uploadedFiles[username]) {
            uploadedFiles[username] = {
                demandFile: null,
                costFile: null,
                workersFile: null,
            };
            console.log(`Initialized tracking for username: ${username}`);
        }

        // Save uploaded files to the tracking object
        if (req.files['demandFile']) {
            uploadedFiles[username].demandFile = req.files['demandFile'][0].path;
            console.log(`Saved demandFile for ${username}`);
        }
        if (req.files['costFile']) {
            uploadedFiles[username].costFile = req.files['costFile'][0].path;
            console.log(`Saved costFile for ${username}`);
        }
        if (req.files['workersFile']) {
            uploadedFiles[username].workersFile = req.files['workersFile'][0].path;
            console.log(`Saved workersFile for ${username}`);
        }

        // Save the updated state to the temporary file
        saveUploadedFilesState();

        console.log("Current state of uploadedFiles:", uploadedFiles);

        // Check if all files have been uploaded
        const { demandFile, costFile, workersFile } = uploadedFiles[username];
        if (demandFile && costFile && workersFile) {
            // Parse the CSV files
            const demandData = await parseCSV(demandFile);
            const costData = await parseCSV(costFile);
            const workersData = await parseCSV(workersFile);

            // Create the optimized schedule
            const scheduleArray = createOptimizedSchedule(demandData, costData, workersData);

            // Save the schedule to the database
            await saveScheduleToDB(scheduleArray, username);

            // Clean up: Remove the files from the `uploadedFiles` object

            /*
            //delete uploadedFiles[username];
            //console.log("delete upload files");
            //saveUploadedFilesState(); // Save the state after cleanup
            */


            res.status(200).json({ message: 'Schedule created successfully', schedule: scheduleArray });
        } else {
            // If not all files are uploaded yet, respond with a waiting message
            res.status(200).send('File uploaded successfully. Waiting for remaining files.');
        }
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).send(`Error uploading files: ${error.message}`);
    }
});

module.exports = router;
