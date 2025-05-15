const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const jwt = require('jsonwebtoken');
const { Kafka, Partitioners } = require('kafkajs');
const mongoose = require('mongoose');

// Configuration JWT
const JWT_SECRET = 'your_jwt_secret_key';

// Configuration Kafka
const kafka = new Kafka({
    clientId: 'auth-service',
    brokers: ['localhost:9092']
});

const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner
});

// Charger le fichier auth.proto
const authProtoPath = 'auth.proto';
const authProtoDefinition = protoLoader.loadSync(authProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const authProto = grpc.loadPackageDefinition(authProtoDefinition).auth;

// Base de données simulée des utilisateurs (à remplacer par une vraie BD)
const users = [
    {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
    },
    {
        id: '2',
        username: 'user',
        email: 'user@example.com',
        password: 'user123',
        role: 'customer'
    }
];

// Fonction pour publier un événement sur Kafka
const publishEvent = async (topic, event) => {
    try {
        await producer.connect();
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(event) }],
        });
    } catch (error) {
        console.error('Error publishing to Kafka:', error);
    }
};

// Implémentation du service d'authentification
const authService = {
    login: async (call, callback) => {
        const { username, password } = call.request;

        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            callback(null, { token: '', user: null });
            return;
        }

        // Créer un token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Publier un événement de connexion sur Kafka
        await publishEvent('auth_events', {
            type: 'USER_LOGGED_IN',
            userId: user.id,
            timestamp: new Date().toISOString()
        });

        // Retourner la réponse sans le mot de passe
        const { password: _, ...userWithoutPassword } = user;
        callback(null, { token, user: userWithoutPassword });
    },

    register: async (call, callback) => {
        console.log('Register request:', call.request);
        const { username, email, password, role } = call.request;

        // Vérifier si l'utilisateur existe déjà
        if (users.some(u => u.username === username || u.email === email)) {
            callback(null, {
                success: false,
                message: 'Username or email already exists',
                user: null
            });
            return;
        }

        // Créer un nouvel utilisateur
        const newUser = {
            id: (users.length + 1).toString(),
            username,
            email,
            password,
            role: role || 'customer'
        };

        users.push(newUser);

        // Publier un événement d'inscription sur Kafka
        await publishEvent('auth_events', {
            type: 'USER_REGISTERED',
            userId: newUser.id,
            timestamp: new Date().toISOString()
        });

        // Retourner la réponse sans le mot de passe
        const { password: _, ...userWithoutPassword } = newUser;
        callback(null, {
            success: true,
            message: 'Registration successful',
            user: userWithoutPassword
        });
    },

    validateToken: (call, callback) => {
        const { token } = call.request;

        try {
            // Vérifier le token JWT
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = users.find(u => u.id === decoded.id);

            if (!user) {
                callback(null, { valid: false, user: null });
                return;
            }

            // Retourner la réponse sans le mot de passe
            const { password: _, ...userWithoutPassword } = user;
            callback(null, { valid: true, user: userWithoutPassword });
        } catch (error) {
            callback(null, { valid: false, user: null });
        }
    }
};

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(authProto.AuthService.service, authService);
const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
        console.error('Échec de la liaison du serveur:', err);
        return;
    }
    console.log(`Le serveur s'exécute sur le port ${port}`);
});

console.log(`Microservice d'authentification en cours d'exécution sur le port ${port}`);

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
});