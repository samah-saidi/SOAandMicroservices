// apiGateway.js
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Kafka, Partitioners } = require('kafkajs');
const path = require('path');

// Charger les fichiers proto
const authProtoPath = path.join(__dirname, 'auth.proto');
const productProtoPath = path.join(__dirname, 'product.proto');
const decorationProtoPath = path.join(__dirname, 'decoration.proto');
const typeDefs = require('./schema');
const { resolvers, context } = require('./resolvers');

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'api-gateway',
  brokers: ['localhost:9092']
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

// Créer une nouvelle application Express
const app = express();

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
  'localhost:50056',
  grpc.credentials.createInsecure()
);

const decorationClient = new decorationProto.DecorationService(
  'localhost:50053',
  grpc.credentials.createInsecure()
);

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

// Créer une instance ApolloServer avec le schéma et les résolveurs importés
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    console.error('GraphQL Error:', error);
    return formattedError;
  },
});

// Middleware pour la vérification du token JWT
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || '';

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    authClient.validateToken({ token }, (err, response) => {
      if (err || !response.valid) {
        req.user = null;
      } else {
        req.user = response.user;
      }
      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

// Démarrer le serveur Apollo
(async () => {
  await server.start();

  // Appliquer les middlewares
  app.use(cors());
  app.use(bodyParser.json());

  // Appliquer le middleware d'authentification pour toutes les routes
  app.use(authMiddleware);

  // Appliquer le middleware ApolloServer pour GraphQL
  app.use('/graphql', expressMiddleware(server, { context }));

  // Routes REST pour l'authentification
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    authClient.login({ username, password }, async (err, response) => {
      if (err || !response.token) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      // Publier un événement de connexion sur Kafka
      await publishEvent('gateway_events', {
        type: 'USER_LOGIN_ATTEMPT',
        username,
        success: true,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        token: response.token,
        user: response.user
      });
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { username, email, password, role } = req.body;
    authClient.register({ username, email, password, role }, (err, response) => {
      if (err) {
        console.error('gRPC error:', err);
        return res.status(500).json({ success: false, message: 'Registration failed' });
      }
      res.json(response);
    });
  });

  // Routes REST pour les produits
  app.get('/api/products', (req, res) => {
    const { query, category, minPrice, maxPrice } = req.query;

    productClient.searchProducts({
      query,
      category,
      min_price: minPrice ? parseFloat(minPrice) : undefined,
      max_price: maxPrice ? parseFloat(maxPrice) : undefined
    }, (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch products'
        });
      }

      res.json({
        success: true,
        products: response.products
      });
    });
  });

  app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;

    productClient.getProduct({ product_id: id }, (err, response) => {
      if (err) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        product: response.product
      });
    });
  });

  app.post('/api/products', (req, res) => {
    // Vérifier l'authentification et les autorisations
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin permissions required'
      });
    }

    const { name, description, price, stock, category, images } = req.body;

    productClient.createProduct({
      name,
      description,
      price,
      stock,
      category,
      images: images || []
    }, async (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create product'
        });
      }

      // Publier un événement de création de produit sur Kafka
      await publishEvent('gateway_events', {
        type: 'PRODUCT_CREATED_VIA_REST',
        productId: response.product.id,
        productName: response.product.name,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(response);
    });
  });

  app.put('/api/products/:id', (req, res) => {
    // Vérifier l'authentification et les autorisations
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin permissions required'
      });
    }

    const id = req.params.id;
    const { name, description, price, stock, category, images } = req.body;

    productClient.updateProduct({
      product_id: id,
      name,
      description,
      price,
      stock,
      category,
      images: images || []
    }, (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update product'
        });
      }

      res.json(response);
    });
  });

  app.delete('/api/products/:id', (req, res) => {
    // Vérifier l'authentification et les autorisations
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin permissions required'
      });
    }

    const id = req.params.id;

    productClient.deleteProduct({ product_id: id }, (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete product'
        });
      }

      res.json(response);
    });
  });

  // Routes REST pour les articles de décoration
  app.get('/api/decoration', (req, res) => {
    const { query, style, material, minPrice, maxPrice } = req.query;

    decorationClient.searchDecorationArticles({
      query,
      style,
      material,
      min_price: minPrice ? parseFloat(minPrice) : undefined,
      max_price: maxPrice ? parseFloat(maxPrice) : undefined
    }, (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch decoration articles'
        });
      }

      res.json({
        success: true,
        articles: response.articles
      });
    });
  });

  app.get('/api/decoration/:id', (req, res) => {
    const id = req.params.id;

    decorationClient.getDecorationArticle({ article_id: id }, (err, response) => {
      if (err) {
        return res.status(404).json({
          success: false,
          message: 'Decoration article not found'
        });
      }

      res.json({
        success: true,
        article: response.article
      });
    });
  });

  app.post('/api/decoration', (req, res) => {
    // Vérifier l'authentification et les autorisations
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin permissions required'
      });
    }

    const { name, description, price, stock, style, material, images, dimensions, color } = req.body;

    decorationClient.createDecorationArticle({
      name,
      description,
      price,
      stock,
      style,
      material,
      images: images || [],
      dimensions,
      color
    }, async (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create decoration article'
        });
      }

      // Publier un événement de création d'article de décoration sur Kafka
      await publishEvent('gateway_events', {
        type: 'DECORATION_ARTICLE_CREATED_VIA_REST',
        articleId: response.article.id,
        articleName: response.article.name,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(response);
    });
  });

  app.put('/api/decoration/:id', (req, res) => {
    // Vérifier l'authentification et les autorisations
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin permissions required'
      });
    }

    const id = req.params.id;
    const { name, description, price, stock, style, material, images, dimensions, color } = req.body;

    decorationClient.updateDecorationArticle({
      article_id: id,
      name,
      description,
      price,
      stock,
      style,
      material,
      images: images || [],
      dimensions,
      color
    }, (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update decoration article'
        });
      }

      res.json(response);
    });
  });

  app.delete('/api/decoration/:id', (req, res) => {
    // Vérifier l'authentification et les autorisations
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin permissions required'
      });
    }

    const id = req.params.id;

    decorationClient.deleteDecorationArticle({ article_id: id }, (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete decoration article'
        });
      }

      res.json(response);
    });
  });

  // Démarrer le serveur Express
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`API Gateway démarré sur le port ${PORT}`);
  });
})();