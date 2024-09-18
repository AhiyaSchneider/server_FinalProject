const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

// Get all workers
router.get('/', workerController.getAllWorkers);

// Add a new worker
router.post('/', workerController.addWorker);

module.exports = router;
