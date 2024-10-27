const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    name: String,
    commission: String,
    text: String,
    approved: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    likedByIPs: { 
        type: [{ 
            ip: String, 
            vote: String  // Stores 'like' or 'dislike'
        }], 
        default: [] 
    }
});

module.exports = mongoose.model('Review', reviewSchema);
