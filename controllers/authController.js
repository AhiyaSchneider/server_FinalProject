const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET || "AhiyaArielYaishRole"; // Use an environment variable for security

async function register(req, res) {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}

async function login(req, res) {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log("401");
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            jwtSecret,
            { expiresIn: "1h" } // Token expires in 1 hour
        );

        res.status(201).json({
            message: "User logged in successfully",
            token, // Send the token to the client
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = { register, login };
