const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = __dirname + '/cart.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const cartProto = grpc.loadPackageDefinition(packageDefinition).CartService;

const client = new cartProto('localhost:50054', grpc.credentials.createInsecure());

client.AddToCart({ userId: 'user1', productId: 'prod1', quantity: 2 }, (err, res) => {
    if (err) return console.error('AddToCart error:', err);
    console.log('AddToCart:', res);

    client.GetCart({ userId: 'user1' }, (err, res) => {
        if (err) return console.error('GetCart error:', err);
        console.log('GetCart:', res);

        client.RemoveFromCart({ userId: 'user1', productId: 'prod1', quantity: 1 }, (err, res) => {
            if (err) return console.error('RemoveFromCart error:', err);
            console.log('RemoveFromCart:', res);

            client.GetCart({ userId: 'user1' }, (err, res) => {
                if (err) return console.error('GetCart error:', err);
                console.log('GetCart after remove:', res);
            });
        });
    });
});
