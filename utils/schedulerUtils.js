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

// Scheduling logic as explained previously
function createOptimizedSchedule(demandData, costData, workersData) {
    let schedule = [];

    // Convert demandData into a more usable format
    demandData = demandData.map(d => {
        const [startTime, endTime] = d['Time Interval'].split('-');
        return {
            date: d['Date'],
            startTime: startTime,
            endTime: endTime,
            skill: d['Worker Type'],  // Assuming Worker Type maps to skill
            requiredWorkers: parseInt(d.Demand, 10)  // Convert Demand to integer
        };
    });

    // Iterate over each demand entry
    demandData.forEach(demand => {
        // Find workers that match the skill required in the demand
        let availableWorkers = workersData.filter(worker => 
            worker.Skills === demand.skill // Match skills
        );

        // Find the hourly cost for the required skill from costData
        let shiftCost = costData.find(shift => shift.Skill === demand.skill);
        
        // Sort available workers by hourly cost
        availableWorkers.sort((a, b) => {
            const costA = shiftCost ? parseInt(shiftCost['Hourly Cost'], 10) : Infinity; // Use Infinity if no cost found
            const costB = shiftCost ? parseInt(shiftCost['Hourly Cost'], 10) : Infinity; // Same here
            return costA - costB; // Sort by cost
        });

        let assignedWorkers = [];
        let requiredCount = demand.requiredWorkers;

        // Check availability and assign workers based on minimum cost
        for (let j = 0; j < availableWorkers.length && requiredCount > 0; j++) {
            let worker = availableWorkers[j];
            
            // Check if the worker is available for the time slot (you might want to define actual availability)
            // For now, we will assume all workers are available for simplicity
            // Assign worker only if they can meet demand
            assignedWorkers.push({
                workerId: worker['Worker ID'],
                workerName: worker.Name,
                hourlyCost: shiftCost ? parseInt(shiftCost['Hourly Cost'], 10) : 0 // Add hourly cost
            });
            requiredCount--;
        }

        // If not all workers could be assigned, log or handle this condition (e.g., worker shortage)
        if (requiredCount > 0) {
            console.warn(`Not enough workers to meet demand for ${demand.skill} on ${demand.date} (${demand.startTime}-${demand.endTime})`);
        }

        // Add the filled shift to the schedule
        schedule.push({
            date: demand.date,
            startTime: demand.startTime,
            endTime: demand.endTime,
            skill: demand.skill,
            workers: assignedWorkers,
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
