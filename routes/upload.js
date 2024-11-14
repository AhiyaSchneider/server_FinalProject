const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const authenticateToken = require('../middleware/authenticateToken'); // Import the middleware
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
}

// Function to save the state to the temporary file
const saveUploadedFilesState = () => {
    fs.writeFileSync(tempFilePath, JSON.stringify(uploadedFiles, null, 2));
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
router.post(
    '/',
    authenticateToken, // Use the authentication middleware
    upload.fields([
        { name: 'demandFile', maxCount: 1 },
        { name: 'costFile', maxCount: 1 },
        { name: 'workersFile', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            // Attempt to get the username from the request body or from the authenticated user
            let username = req.body.username || req.user.username; // `req.user` is added by the middleware

            // If username is still not available, return an error
            if (!username) {
                console.log('Username not provided in the request, and no authenticated username found.');
                return res.status(400).send('Username is required.');
            }

            // Initialize tracking for the user's uploaded files if not already done
            if (!uploadedFiles[username]) {
                uploadedFiles[username] = {
                    demandFile: null,
                    costFile: null,
                    workersFile: null,
                };
            }

            // Save uploaded files to the tracking object
            if (req.files['demandFile']) {
                uploadedFiles[username].demandFile = req.files['demandFile'][0].path;
            }
            if (req.files['costFile']) {
                uploadedFiles[username].costFile = req.files['costFile'][0].path;
            }
            if (req.files['workersFile']) {
                uploadedFiles[username].workersFile = req.files['workersFile'][0].path;
            }

            // Save the updated state to the temporary file
            saveUploadedFilesState();

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

                res.status(200).json({ message: 'Schedule created successfully', schedule: scheduleArray });
            } else {
                // If not all files are uploaded yet, respond with a waiting message
                res.status(200).send('File uploaded successfully. Waiting for remaining files.');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            res.status(500).send(`Error uploading files: ${error.message}`);
        }
    }
);

module.exports = router;
