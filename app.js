const express = require('express');
const mongoose = require('mongoose');
const Review = require('./Functions/Review.js'); // Assuming this is still in the main folder
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); // Serve static files from the main folder
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve index.html from the main folder
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html')); // Serve admin.html from the main folder
});

// Submit a review
app.post('/reviews', async (req, res) => {
    const { name, commission, text } = req.body;
    const review = new Review({ name, commission, text });
    await review.save();
    res.status(201).send(review);
});

// Fetch approved reviews
app.get('/reviews/approved', async (req, res) => {
    const reviews = await Review.find({ approved: true });
    res.send(reviews);
});

// Fetch pending reviews for admin
app.get('/reviews/pending', async (req, res) => {
    const reviews = await Review.find({ approved: false });
    res.send(reviews);
});

// Approve a review
app.put('/reviews/:id/approve', async (req, res) => {
    const { id } = req.params;
    await Review.findByIdAndUpdate(id, { approved: true });
    res.sendStatus(204);
});

// Delete a review
app.delete('/reviews/:id', async (req, res) => {
    const { id } = req.params;
    await Review.findByIdAndDelete(id);
    res.sendStatus(204);
});

// Like or dislike a review
app.put('/reviews/:id/like', async (req, res) => {
    const { id } = req.params;
    const ip = req.ip; // Get the user's IP address

    const review = await Review.findById(id);

    // Check if the user has already liked or disliked this review
    const existingVote = review.likedByIPs.find(vote => vote.ip === ip);

    if (existingVote) {
        // If the user has already voted, toggle the vote
        if (existingVote.vote === 'like') {
            review.likes--;
            review.likedByIPs = review.likedByIPs.filter(vote => vote.ip !== ip);
        } else {
            review.likes++;
            existingVote.vote = 'like';
        }
    } else {
        // If the user hasn't voted yet, add a new like
        review.likes++;
        review.likedByIPs.push({ ip, vote: 'like' });
    }

    await review.save();
    res.send(review);
});

// Admin login (dummy implementation)
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Replace with your actual authentication logic
    if (username === 'elzino123' && password === 'elzino123') {
        req.session.user = { username };
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
