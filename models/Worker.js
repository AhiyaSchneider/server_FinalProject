const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WorkerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    skills: {
        type: [String],
        required: true
    },
    shift: {
        type: String
    }
});

module.exports = mongoose.model('worker', WorkerSchema);
