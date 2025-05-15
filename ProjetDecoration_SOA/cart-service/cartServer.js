const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = __dirname + '/cart.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const cartProto = grpc.loadPackageDefinition(packageDefinition).CartService;

// In-memory storage for carts (in a real application, this would be a database)
const carts = new Map();

// Helper function to get or create a user's cart
function getUserCart(userId) {
    if (!carts.has(userId)) {
        carts.set(userId, []);
    }
    return carts.get(userId);
}

// Implementation of AddToCart
function addToCart(call, callback) {
    const { userId, productId, quantity } = call.request;
    const cart = getUserCart(userId);

    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ productId, quantity });
    }

    callback(null, {
        success: true,
        message: 'Item added to cart successfully',
        items: cart
    });
}

// Implementation of RemoveFromCart
function removeFromCart(call, callback) {
    const { userId, productId, quantity } = call.request;
    const cart = getUserCart(userId);

    const itemIndex = cart.findIndex(item => item.productId === productId);
    if (itemIndex !== -1) {
        const item = cart[itemIndex];
        item.quantity -= quantity;

        if (item.quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }

    callback(null, {
        success: true,
        message: 'Item removed from cart successfully',
        items: cart
    });
}

// Implementation of GetCart
function getCart(call, callback) {
    const { userId } = call.request;
    const cart = getUserCart(userId);

    callback(null, {
        success: true,
        message: 'Cart retrieved successfully',
        items: cart
    });
}

// Create the server
const server = new grpc.Server();

// Add the service
server.addService(cartProto.service, {
    AddToCart: addToCart,
    RemoveFromCart: removeFromCart,
    GetCart: getCart
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.tryShutdown((err) => {
        if (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
        console.log('Server shutdown complete');
        process.exit(0);
    });
});

// Bind and start the server
const address = '0.0.0.0:50054';
server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
        console.error('Error binding server:', error);
        if (error.code === 'EADDRINUSE') {
            console.error('Port 50054 is already in use. Please ensure no other instance is running.');
            console.error('You can find and kill the process using:');
            console.error('netstat -ano | findstr :50054');
            console.error('taskkill /F /PID <PID>');
        }
        process.exit(1);
    }
    console.log(`Cart service running on port ${port}`);
}); 