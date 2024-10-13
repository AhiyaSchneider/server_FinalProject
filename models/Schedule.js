const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    day: String,
    startTime: String,
    endTime: String,
    skill: String,
    workers: [{
        workerId: String,
        shift: {
            startTime: String,
            endTime: String,
            cost: Number
        }
    }]
});

module.exports = mongoose.model('Schedule', scheduleSchema);
