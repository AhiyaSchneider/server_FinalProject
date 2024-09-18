const Worker = require('../models/Worker');

// Get all workers
exports.getAllWorkers = async (req, res) => {
    try {
        const workers = await Worker.find();
        res.json(workers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add a new worker
exports.addWorker = async (req, res) => {
    const worker = new Worker({
        name: req.body.name,
        skills: req.body.skills
    });

    try {
        const newWorker = await worker.save();
        res.status(201).json(newWorker);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

