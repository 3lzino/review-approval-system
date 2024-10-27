require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const Review = require('./models/Review');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// MongoDB connection using environment variables for secure connection (e.g., MongoDB Atlas)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/reviewsDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

// Serve static files from the "views" directory
app.use(express.static('views'));

// Session configuration with secure cookies
app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }), // Clear expired sessions daily
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000, secure: false } // 30-minute session, disable secure for testing
}));

// Middleware to check if the user is authenticated (for admin routes)
function checkAuth(req, res, next) {
    console.log('Session on admin page:', req.session); // Debug log
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
}

// User login route for admin access
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'elzino123' && password === 'elzino123') {
        req.session.isAdmin = true;
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return res.sendStatus(500);
            }
            console.log('Session after login:', req.session);
            res.sendStatus(200);
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
});

// Endpoint to return session info for debugging
app.get('/session-info', (req, res) => {
    res.json({ session: req.session });
});

// Review submission route (unauthenticated)
app.post('/reviews', async (req, res) => {
    const { name, commission, text } = req.body;
    const review = new Review({ name, commission, text, approved: false });
    await review.save();
    res.status(201).json(review);
});

// Route to fetch pending reviews (admin only)
app.get('/reviews/pending', checkAuth, async (req, res) => {
    const reviews = await Review.find({ approved: false });
    res.json(reviews);
});

// Route to fetch approved reviews (public)
app.get('/reviews/approved', async (req, res) => {
    const reviews = await Review.find({ approved: true });
    res.json(reviews);
});

// Route to delete a review (admin only)
app.delete('/reviews/:id', checkAuth, async (req, res) => {
    await Review.findByIdAndDelete(req.params.id);
    res.sendStatus(200);
});

// Route to delete a review (admin only)
app.delete('/reviews/:id', checkAuth, async (req, res) => {
    await Review.findByIdAndDelete(req.params.id);
    res.sendStatus(200);
});

// Like functionality for reviews
app.put('/reviews/:id/like', async (req, res) => {
    const reviewId = req.params.id;
    const userIp = req.ip;

    try {
        const review = await Review.findById(reviewId);
        const userIndex = review.likedByIPs.findIndex((entry) => entry.ip === userIp);

        if (userIndex === -1) {
            // If the user hasn't voted, add a "like" vote
            review.likes += 1;
            review.likedByIPs.push({ ip: userIp, vote: 'like' });
        } else if (review.likedByIPs[userIndex].vote === 'dislike') {
            // If the user previously disliked, switch to like
            review.likes += 2;
            review.likedByIPs[userIndex].vote = 'like';
        } else {
            // If the user already liked, remove their like
            review.likes -= 1;
            review.likedByIPs.splice(userIndex, 1);
        }

        await review.save();
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Dislike functionality for reviews
app.put('/reviews/:id/dislike', async (req, res) => {
    const reviewId = req.params.id;
    const userIp = req.ip;

    try {
        const review = await Review.findById(reviewId);
        const userIndex = review.likedByIPs.findIndex((entry) => entry.ip === userIp);

        if (userIndex === -1) {
            // If the user hasn't voted, add a "dislike" vote
            review.likes -= 1;
            review.likedByIPs.push({ ip: userIp, vote: 'dislike' });
        } else if (review.likedByIPs[userIndex].vote === 'like') {
            // If the user previously liked, switch to dislike
            review.likes -= 2;
            review.likedByIPs[userIndex].vote = 'dislike';
        } else {
            // If the user already disliked, remove their dislike
            review.likes += 1;
            review.likedByIPs.splice(userIndex, 1);
        }

        await review.save();
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
