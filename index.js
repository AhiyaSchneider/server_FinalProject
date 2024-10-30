// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const uploadRoute = require('./routes/upload');
const authRoutes = require('./routes/authRoutes'); // Import authentication routes

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static('uploads'));

const db = require('./config/db').mongoURI;
mongoose.connect(db)
    .then(() => console.log('MongoDB connected, updated '))
    .catch(err => console.log(err));

// Use the upload route
app.use('/api/upload', uploadRoute);

// Use the authentication routes
app.use('/api/auth', authRoutes); // Add authentication routes here

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
