// resolvers.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Charger les fichiers proto
const authProtoPath = path.join(__dirname, 'auth.proto');
const productProtoPath = path.join(__dirname, 'product.proto');
const decorationProtoPath = path.join(__dirname, 'decoration.proto');

const authProtoDefinition = protoLoader.loadSync(authProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const productProtoDefinition = protoLoader.loadSync(productProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const decorationProtoDefinition = protoLoader.loadSync(decorationProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const authProto = grpc.loadPackageDefinition(authProtoDefinition).auth;
const productProto = grpc.loadPackageDefinition(productProtoDefinition).product;
const decorationProto = grpc.loadPackageDefinition(decorationProtoDefinition).decoration;

// Créer les clients gRPC
const authClient = new authProto.AuthService(
    'localhost:50051',
    grpc.credentials.createInsecure()
);

const productClient = new productProto.ProductService(
    'localhost:50055',
    grpc.credentials.createInsecure()
);

const decorationClient = new decorationProto.DecorationService(
    'localhost:50053',
    grpc.credentials.createInsecure()
);

// Promisify les appels gRPC
const promisifyGrpcCall = (client, method) => (request) => {
    return new Promise((resolve, reject) => {
        client[method](request, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
};

const resolvers = {
    Query: {
        // Authentification
        me: async (_, __, { user }) => {
            if (!user) return null;
            return user;
        },

        // Produits
        products: async (_, { query, category, minPrice, maxPrice }) => {
            try {
                const response = await promisifyGrpcCall(productClient, 'searchProducts')({
                    query,
                    category,
                    min_price: minPrice,
                    max_price: maxPrice
                });
                return response.products;
            } catch (error) {
                console.error('Error fetching products:', error);
                throw new Error('Failed to fetch products');
            }
        },

        product: async (_, { id }) => {
            try {
                const response = await promisifyGrpcCall(productClient, 'getProduct')({
                    product_id: id
                });
                return response.product;
            } catch (error) {
                console.error('Error fetching product:', error);
                throw new Error('Product not found');
            }
        },

        // Articles de décoration
        decorationArticles: async (_, { query, style, material, minPrice, maxPrice }) => {
            try {
                const response = await promisifyGrpcCall(decorationClient, 'searchDecorationArticles')({
                    query,
                    style,
                    material,
                    min_price: minPrice,
                    max_price: maxPrice
                });
                return response.articles;
            } catch (error) {
                console.error('Error fetching decoration articles:', error);
                throw new Error('Failed to fetch decoration articles');
            }
        },

        decorationArticle: async (_, { id }) => {
            try {
                const response = await promisifyGrpcCall(decorationClient, 'getDecorationArticle')({
                    article_id: id
                });
                return response.article;
            } catch (error) {
                console.error('Error fetching decoration article:', error);
                throw new Error('Decoration article not found');
            }
        }
    },

    Mutation: {
        // Authentification
        login: async (_, { username, password }) => {
            try {
                const response = await promisifyGrpcCall(authClient, 'login')({
                    username,
                    password
                });
                return response;
            } catch (error) {
                console.error('Login error:', error);
                throw new Error('Invalid credentials');
            }
        },

        register: async (_, { username, email, password, role }) => {
            try {
                const response = await promisifyGrpcCall(authClient, 'register')({
                    username,
                    email,
                    password,
                    role
                });
                return response;
            } catch (error) {
                console.error('Registration error:', error);
                throw new Error('Registration failed');
            }
        },

        // Produits
        createProduct: async (_, { name, description, price, stock, category, images }, { user }) => {
            if (!user || user.role !== 'admin') {
                throw new Error('Admin permissions required');
            }

            try {
                const response = await promisifyGrpcCall(productClient, 'createProduct')({
                    name,
                    description,
                    price,
                    stock,
                    category,
                    images: images || []
                });
                return response.product;
            } catch (error) {
                console.error('Error creating product:', error);
                throw new Error('Failed to create product');
            }
        },

        updateProduct: async (_, { id, ...updates }, { user }) => {
            if (!user || user.role !== 'admin') {
                throw new Error('Admin permissions required');
            }

            try {
                const response = await promisifyGrpcCall(productClient, 'updateProduct')({
                    product_id: id,
                    ...updates
                });
                return response.product;
            } catch (error) {
                console.error('Error updating product:', error);
                throw new Error('Failed to update product');
            }
        },

        deleteProduct: async (_, { id }, { user }) => {
            if (!user || user.role !== 'admin') {
                throw new Error('Admin permissions required');
            }

            try {
                await promisifyGrpcCall(productClient, 'deleteProduct')({
                    product_id: id
                });
                return true;
            } catch (error) {
                console.error('Error deleting product:', error);
                throw new Error('Failed to delete product');
            }
        },

        // Articles de décoration
        createDecorationArticle: async (_, { name, description, price, stock, style, material, images, dimensions, color }, { user }) => {
            if (!user || user.role !== 'admin') {
                throw new Error('Admin permissions required');
            }

            try {
                const response = await promisifyGrpcCall(decorationClient, 'createDecorationArticle')({
                    name,
                    description,
                    price,
                    stock,
                    style,
                    material,
                    images: images || [],
                    dimensions,
                    color
                });
                return response.article;
            } catch (error) {
                console.error('Error creating decoration article:', error);
                throw new Error('Failed to create decoration article');
            }
        },

        updateDecorationArticle: async (_, { id, ...updates }, { user }) => {
            if (!user || user.role !== 'admin') {
                throw new Error('Admin permissions required');
            }

            try {
                const response = await promisifyGrpcCall(decorationClient, 'updateDecorationArticle')({
                    article_id: id,
                    ...updates
                });
                return response.article;
            } catch (error) {
                console.error('Error updating decoration article:', error);
                throw new Error('Failed to update decoration article');
            }
        },

        deleteDecorationArticle: async (_, { id }, { user }) => {
            if (!user || user.role !== 'admin') {
                throw new Error('Admin permissions required');
            }

            try {
                await promisifyGrpcCall(decorationClient, 'deleteDecorationArticle')({
                    article_id: id
                });
                return true;
            } catch (error) {
                console.error('Error deleting decoration article:', error);
                throw new Error('Failed to delete decoration article');
            }
        }
    }
};

// Middleware de contexte pour l'authentification
const context = async ({ req }) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    if (!token) return { user: null };

    try {
        const response = await promisifyGrpcCall(authClient, 'validateToken')({ token });
        return { user: response.valid ? response.user : null };
    } catch (error) {
        console.error('Token validation error:', error);
        return { user: null };
    }
};

module.exports = { resolvers, context };