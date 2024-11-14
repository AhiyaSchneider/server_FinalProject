const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key
        req.user = decoded; // Attach the decoded token payload to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        res.status(403).json({ message: 'Invalid token.' });
    }
}

module.exports = authenticateToken;
