const mongoose = require('mongoose');
const Review = require('./Review.js'); // Adjust the path if necessary
require('dotenv').config();

const uri = process.env.MONGO_URI; // MongoDB URI from environment variables

let conn = null; // Variable to hold the MongoDB connection

exports.handler = async (event, context) => {
    // Connect to MongoDB if not already connected
    if (conn === null) {
        conn = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }

    try {
        // Handle different HTTP methods
        switch (event.httpMethod) {
            case 'GET':
                // Fetch all approved reviews
                const approvedReviews = await Review.find({ approved: true });
                return {
                    statusCode: 200,
                    body: JSON.stringify(approvedReviews),
                };

            case 'POST':
                // Create a new review
                const { name, commission, text } = JSON.parse(event.body);
                const newReview = new Review({ name, commission, text });
                await newReview.save();
                return {
                    statusCode: 201,
                    body: JSON.stringify(newReview),
                };

            case 'PUT':
                // Approve a review by ID
                const { id } = JSON.parse(event.body);
                const updatedReview = await Review.findByIdAndUpdate(id, { approved: true }, { new: true });
                return updatedReview 
                    ? { statusCode: 200, body: JSON.stringify(updatedReview) }
                    : { statusCode: 404, body: JSON.stringify({ error: 'Review not found' }) };

            case 'DELETE':
                // Delete a review by ID
                const { reviewId } = JSON.parse(event.body);
                await Review.findByIdAndDelete(reviewId);
                return { statusCode: 204 };

            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({ error: 'Method Not Allowed' }),
                };
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error' }),
        };
    }
};
