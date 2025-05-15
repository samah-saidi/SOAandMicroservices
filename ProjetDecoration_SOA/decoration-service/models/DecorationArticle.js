const mongoose = require('mongoose');

const decorationArticleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    style: {
        type: String,
        required: true
    },
    material: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
    dimensions: {
        type: String
    },
    color: {
        type: String
    },
    brand: {
        type: String
    },
    condition: {
        type: String
    },
    location: {
        type: String
    },
    sentimentAnalysis: {
        score: Number,
        keywords: [String],
        lastUpdated: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DecorationArticle', decorationArticleSchema); 