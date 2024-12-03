// server/models/imageModel.js

const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    paragraph: String,
    imageUrl: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Image', ImageSchema);
