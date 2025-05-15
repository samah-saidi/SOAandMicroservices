const express = require('express');
const mongoose = require('mongoose');
const grpc = require('@grpc/grpc-js');
const { startGrpcServer } = require('./grpc/category-service');
const { connectProducer, connectConsumer } = require('./kafka/category-events');

// Configuration
const PORT = process.env.PORT || 3002;
const GRPC_PORT = process.env.GRPC_PORT || 50052;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/decoration-articles';

// Initialisation de l'application Express
const app = express();
app.use(express.json());

// Middleware de base
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Route de vérification de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'category-service' });
});

// Connexion à MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Connexion à MongoDB réussie');
    
    // Démarrer le serveur Express
    app.listen(PORT, () => {
      console.log(`Serveur Express démarré sur le port ${PORT}`);
    });
    
    // Démarrer le serveur gRPC
    const server = startGrpcServer();
    server.bindAsync(
      `0.0.0.0:${GRPC_PORT}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          console.error('Erreur lors du démarrage du serveur gRPC:', err);
          return;
        }
        console.log(`Serveur gRPC démarré sur le port ${port}`);
        server.start();
      }
    );
    
    // Connecter à Kafka
    const initKafka = async () => {
      try {
        await connectProducer();
        await connectConsumer();
        console.log('Connexions Kafka établies');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de Kafka:', error);
      }
    };
    
    initKafka();
  })
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
  });

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Une erreur est survenue',
      status: err.status || 500
    }
  });
});

// Gestion de l'arrêt propre de l'application
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('Connexion MongoDB fermée');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la fermeture de la connexion MongoDB:', error);
    process.exit(1);
  }
});