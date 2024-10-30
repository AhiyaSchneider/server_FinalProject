const csv = require('csv-parser');
const fs = require('fs');
const Schedule = require('../models/Schedule');

// Function to parse CSV files
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

function createOptimizedSchedule(demandData, costData, workersData) {
    let schedule = [];

    // Convert demandData into a more usable format with time intervals
    demandData = demandData.map(d => {
        const [startTime, endTime] = d['Time Interval'].split('-');
        return {
            date: d['Date'],
            startTime: startTime,
            endTime: endTime,
            skill: d['Worker Type'],
            requiredWorkers: parseInt(d.Demand, 10)
        };
    });

    // Process each demand entry to assign workers
    demandData.forEach(demand => {
        // Step 1: Filter workers by skill and availability for the required time slot
        let availableWorkers = workersData.filter(worker => {
            const workerAvailableFrom = worker['Available From'];
            const workerAvailableUntil = worker['Available Until'];

            return (
                worker.Skill === demand.skill &&
                workerAvailableFrom <= demand.startTime &&
                workerAvailableUntil >= demand.endTime
            );
        });

        // Step 2: Map each available worker to their hourly cost
        availableWorkers = availableWorkers.map(worker => {
            // Get the worker's hourly cost from costData
            const workerCost = costData.find(
                costEntry => costEntry['Worker ID'] === worker['Worker ID']
            );
            return {
                workerId: worker['Worker ID'],
                workerName: worker['Worker Name'],
                hourlyCost: workerCost ? parseInt(workerCost['Hourly Cost'], 10) : Infinity
            };
        });

        // Step 3: Sort workers by their hourly cost in ascending order (cheapest first)
        availableWorkers.sort((a, b) => a.hourlyCost - b.hourlyCost);

        let assignedWorkers = [];
        let requiredCount = demand.requiredWorkers;

        // Step 4: Assign workers from the sorted list until demand is met or there are no more available workers
        for (let j = 0; j < availableWorkers.length && requiredCount > 0; j++) {
            let worker = availableWorkers[j];
            assignedWorkers.push(worker);
            requiredCount--;
        }

        // Step 5: Check if demand was met; if not, add a warning message
        if (requiredCount > 0) {
            console.warn(`Not enough workers to meet demand for ${demand.skill} on ${demand.date} (${demand.startTime}-${demand.endTime}). Short by ${requiredCount} worker(s).`);
        }

        // Step 6: Add the scheduled shift to the output schedule
        schedule.push({
            date: demand.date,
            startTime: demand.startTime,
            endTime: demand.endTime,
            skill: demand.skill,
            workers: assignedWorkers
        });
    });

    return schedule;
}



// Helper function to check if a worker is already booked for a given time
function isWorkerBooked(schedule, workerId, startTime, endTime) {
    return schedule.some(shift => 
        shift.workers.some(worker => worker.workerId === workerId) &&
        (shift.startTime <= endTime && shift.endTime >= startTime)
    );
}

// Save schedule to the database
async function saveScheduleToDB(schedule) {
    try {
        await Schedule.insertMany(schedule);
    } catch (error) {
        console.error('Error saving schedule to DB:', error);
        throw error;
    }
}

module.exports = { parseCSV, createOptimizedSchedule, saveScheduleToDB };
