const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const Cart = require('./models/Cart');
const PROTO_PATH = __dirname + '/cart.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const cartProto = grpc.loadPackageDefinition(packageDefinition).CartService;

console.log(cartProto);

mongoose.connect('mongodb://localhost:27017/decoration');

async function AddToCart(call, callback) {
    const { userId, productId, quantity } = call.request;
    try {
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }
        const item = cart.items.find(i => i.productId === productId);
        if (item) {
            item.quantity += quantity;
        } else {
            cart.items.push({ productId, quantity });
        }
        await cart.save();
        callback(null, { success: true, message: 'Produit ajouté', items: cart.items });
    } catch (err) {
        callback(null, { success: false, message: err.message, items: [] });
    }
}

async function RemoveFromCart(call, callback) {
    const { userId, productId, quantity } = call.request;
    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return callback(null, { success: false, message: 'Panier non trouvé', items: [] });
        }
        const item = cart.items.find(i => i.productId === productId);
        if (!item) {
            return callback(null, { success: false, message: 'Produit non trouvé', items: cart.items });
        }
        item.quantity -= quantity;
        if (item.quantity <= 0) {
            cart.items = cart.items.filter(i => i.productId !== productId);
        }
        await cart.save();
        callback(null, { success: true, message: 'Produit retiré', items: cart.items });
    } catch (err) {
        callback(null, { success: false, message: err.message, items: [] });
    }
}

async function GetCart(call, callback) {
    const { userId } = call.request;
    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return callback(null, { success: true, message: 'Panier vide', items: [] });
        }
        callback(null, { success: true, message: 'Panier récupéré', items: cart.items });
    } catch (err) {
        callback(null, { success: false, message: err.message, items: [] });
    }
}

const server = new grpc.Server();
server.addService(cartProto.service, {
    AddToCart,
    RemoveFromCart,
    GetCart
});

server.bindAsync('0.0.0.0:50054', grpc.ServerCredentials.createInsecure(), () => {
    console.log('Cart service running on port 50054');
});
