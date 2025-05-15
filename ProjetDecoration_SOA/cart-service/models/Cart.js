const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    productId: String,
    quantity: Number
});

const CartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    items: [CartItemSchema]
});

module.exports = mongoose.model('Cart', CartSchema);
