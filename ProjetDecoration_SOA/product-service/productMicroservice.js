// productMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Kafka, Partitioners } = require('kafkajs');

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'product-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});
const consumer = kafka.consumer({ groupId: 'product-service-group' });

// Charger le fichier product.proto
const productProtoPath = 'product.proto';
const productProtoDefinition = protoLoader.loadSync(productProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const productProto = grpc.loadPackageDefinition(productProtoDefinition).product;

// Base de données simulée des produits (à remplacer par une vraie BD)
const products = [
  {
    id: '1',
    name: 'Lampe design scandinave',
    description: 'Lampe de table avec abat-jour en tissu et pied en bois naturel.',
    price: 79.99,
    stock: 15,
    category: 'Éclairage',
    images: ['lamp1.jpg', 'lamp2.jpg']
  },
  {
    id: '2',
    name: 'Vase en céramique',
    description: 'Vase fait main en céramique, idéal pour accueillir vos fleurs séchées.',
    price: 34.50,
    stock: 8,
    category: 'Accessoires',
    images: ['vase1.jpg']
  },
  {
    id: '3',
    name: 'Coussin bohème',
    description: 'Coussin décoratif avec motifs géométriques et pompons.',
    price: 25.99,
    stock: 20,
    category: 'Textiles',
    images: ['cushion1.jpg', 'cushion2.jpg']
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

// Implémentation du service de produits
const productService = {
  getProduct: (call, callback) => {
    const { product_id } = call.request;
    const product = products.find(p => p.id === product_id);

    if (!product) {
      callback({ code: grpc.status.NOT_FOUND, message: 'Product not found' });
      return;
    }

    callback(null, { product });
  },

  searchProducts: (call, callback) => {
    const { query, category, min_price, max_price } = call.request;

    let filteredProducts = [...products];

    // Filtrer par requête de recherche
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredProducts = filteredProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrer par catégorie
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    // Filtrer par prix minimum
    if (min_price) {
      filteredProducts = filteredProducts.filter(p => p.price >= min_price);
    }

    // Filtrer par prix maximum
    if (max_price) {
      filteredProducts = filteredProducts.filter(p => p.price <= max_price);
    }

    callback(null, { products: filteredProducts });
  },

  createProduct: async (call, callback) => {
    const { name, description, price, stock, category, images } = call.request;

    // Créer un nouvel article
    const newProduct = {
      id: (products.length + 1).toString(),
      name,
      description,
      price,
      stock,
      category,
      images: images || []
    };

    products.push(newProduct);

    // Publier un événement de création de produit sur Kafka
    await publishEvent('product_events', {
      type: 'PRODUCT_CREATED',
      productId: newProduct.id,
      productName: newProduct.name,
      timestamp: new Date().toISOString()
    });

    callback(null, {
      success: true,
      message: 'Product created successfully',
      product: newProduct
    });
  },

  updateProduct: async (call, callback) => {
    const { product_id, name, description, price, stock, category, images } = call.request;

    const productIndex = products.findIndex(p => p.id === product_id);

    if (productIndex === -1) {
      callback({ code: grpc.status.NOT_FOUND, message: 'Product not found' });
      return;
    }

    // Mettre à jour le produit
    const updatedProduct = {
      ...products[productIndex],
      name: name || products[productIndex].name,
      description: description || products[productIndex].description,
      price: price !== undefined ? price : products[productIndex].price,
      stock: stock !== undefined ? stock : products[productIndex].stock,
      category: category || products[productIndex].category,
      images: images || products[productIndex].images
    };

    products[productIndex] = updatedProduct;

    // Publier un événement de mise à jour de produit sur Kafka
    await publishEvent('product_events', {
      type: 'PRODUCT_UPDATED',
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      timestamp: new Date().toISOString()
    });

    callback(null, {
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  },

  deleteProduct: async (call, callback) => {
    const { product_id } = call.request;

    const productIndex = products.findIndex(p => p.id === product_id);

    if (productIndex === -1) {
      callback({ code: grpc.status.NOT_FOUND, message: 'Product not found' });
      return;
    }

    const deletedProduct = products[productIndex];

    // Supprimer le produit
    products.splice(productIndex, 1);

    // Publier un événement de suppression de produit sur Kafka
    await publishEvent('product_events', {
      type: 'PRODUCT_DELETED',
      productId: deletedProduct.id,
      productName: deletedProduct.name,
      timestamp: new Date().toISOString()
    });

    callback(null, {
      success: true,
      message: 'Product deleted successfully'
    });
  }
};

// Fonction pour configurer et démarrer le consumer Kafka
const setupKafkaConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: ['auth_events'] });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log(`Received event: ${event.type}`);

        // Traiter les événements d'authentification
        if (event.type === 'USER_LOGGED_IN') {
          console.log(`User ${event.userId} logged in at ${event.timestamp}`);
          // Ici, vous pourriez mettre à jour des statistiques sur les utilisateurs actifs, etc.
        }
      } catch (error) {
        console.error('Error processing Kafka message:', error);
      }
    },
  });
};

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(productProto.ProductService.service, productService);
const port = 50056;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('Échec de la liaison du serveur:', err);
    return;
  }
  console.log(`Le serveur s'exécute sur le port ${port}`);
  server.start();

  // Démarrer le consumer Kafka après le démarrage du serveur
  setupKafkaConsumer().catch(error => {
    console.error('Error setting up Kafka consumer:', error);
  });
});

console.log(`Microservice de gestion des produits en cours d'exécution sur le port ${port}`);