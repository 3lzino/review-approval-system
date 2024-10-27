const mongoose = require('mongoose');
const Review = require('./Review'); // Adjust the path if necessary
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
                if (event.path === '/reviews/pending') {
                    // Fetch all pending reviews
                    const pendingReviews = await Review.find({ approved: false });
                    return {
                        statusCode: 200,
                        body: JSON.stringify(pendingReviews),
                    };
                } else {
                    // Fetch all approved reviews (for other GET requests)
                    const approvedReviews = await Review.find({ approved: true });
                    return {
                        statusCode: 200,
                        body: JSON.stringify(approvedReviews),
                    };
                }

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
                // Update likes or approve a review by ID
                const { id, like } = JSON.parse(event.body);
                const review = await Review.findById(id);
                if (!review) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ error: 'Review not found' }),
                    };
                }

                // Handle like/dislike logic
                if (like !== undefined) { // If like is provided
                    if (like) {
                        review.likes++;
                    } else {
                        review.likes = Math.max(0, review.likes - 1);
                    }
                } else {
                    // Approve the review if like is not provided
                    review.approved = true;
                }
                await review.save();
                return {
                    statusCode: 200,
                    body: JSON.stringify(review),
                };

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
