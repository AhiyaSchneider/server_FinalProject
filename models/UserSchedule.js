// models/UserSchedule.js
const mongoose = require('mongoose');

// Define the schema for each versioned entry
const versionedScheduleSchema = new mongoose.Schema({
    version: { type: Number, required: true }, // Version number for this schedule set
    schedules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }] // References to Schedule documents
}, { _id: false }); // Disable _id if not needed for each version entry

// Define the UserSchedule schema to store multiple versioned schedules
const userScheduleSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // Unique username for each user
    versions: [versionedScheduleSchema] // Array of versioned schedules
});

module.exports = mongoose.model('UserSchedule', userScheduleSchema);
