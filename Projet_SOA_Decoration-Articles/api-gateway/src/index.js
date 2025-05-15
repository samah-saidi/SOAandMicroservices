const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const bodyParser = require('body-parser');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const articlesController = require('./rest/articles-controller');
const categoriesController = require('./rest/categories-controller');
const { initProducer } = require('./kafka/producer');

// Configuration
const PORT = process.env.PORT || 3000;

// Initialisation de l'application Express
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Route de vérification de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// Routes REST
app.use('/api/articles', articlesController);
app.use('/api/categories', categoriesController);

// Initialisation du serveur Apollo (GraphQL)
async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      console.error('Erreur GraphQL:', error);
      return {
        message: error.message,
        path: error.path,
        code: error.extensions.code
      };
    },
    context: ({ req }) => {
      // Contexte partagé entre les résolveurs
      return {
        headers: req.headers
      };
    }
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  console.log(`Serveur GraphQL disponible à l'adresse: http://localhost:${PORT}${server.graphqlPath}`);
}

// Initialisation du producteur Kafka
async function initKafkaProducer() {
  try {
    await initProducer();
    console.log('Producteur Kafka initialisé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du producteur Kafka:', error);
  }
}

// Démarrage des services
async function startServices() {
  try {
    await startApolloServer();
    await initKafkaProducer();
    
    // Démarrer le serveur Express
    app.listen(PORT, () => {
      console.log(`API Gateway démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage des services:', error);
    process.exit(1);
  }
}

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erreur interne du serveur'
  });
});

// Démarrage de l'application
startServices();

// Gestion de l'arrêt propre de l'application
process.on('SIGINT', async () => {
  console.log('Arrêt de l\'API Gateway...');
  // Fermer proprement toutes les connexions et ressources
  process.exit(0);
});