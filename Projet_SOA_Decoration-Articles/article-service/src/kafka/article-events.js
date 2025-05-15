const { Kafka } = require('kafkajs');

// Configuration de Kafka
const kafka = new Kafka({
  clientId: 'article-service',
  brokers: ['kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Producteur pour les événements d'article
const producer = kafka.producer();

// Topics Kafka pour les événements d'article
const ARTICLE_CREATED_TOPIC = 'article-created';
const ARTICLE_UPDATED_TOPIC = 'article-updated';
const ARTICLE_DELETED_TOPIC = 'article-deleted';
const STOCK_UPDATED_TOPIC = 'stock-updated';

// Fonction pour se connecter au producteur Kafka
async function connectProducer() {
  try {
    await producer.connect();
    console.log('Producteur Kafka connecté');
  } catch (error) {
    console.error('Erreur de connexion au producteur Kafka:', error);
    throw error;
  }
}

// Fonction pour publier un événement de création d'article
async function publishArticleCreated(article) {
  try {
    await producer.send({
      topic: ARTICLE_CREATED_TOPIC,
      messages: [
        {
          key: article.id,
          value: JSON.stringify(article),
          headers: {
            'event-type': 'article-created',
            'timestamp': Date.now().toString()
          }
        }
      ]
    });
    console.log(`Événement article-created publié pour l'article ID: ${article.id}`);
  } catch (error) {
    console.error('Erreur lors de la publication de l\'événement article-created:', error);
    throw error;
  }
}

// Fonction pour publier un événement de mise à jour d'article
async function publishArticleUpdated(article) {
  try {
    await producer.send({
      topic: ARTICLE_UPDATED_TOPIC,
      messages: [
        {
          key: article.id,
          value: JSON.stringify(article),
          headers: {
            'event-type': 'article-updated',
            'timestamp': Date.now().toString()
          }
        }
      ]
    });
    console.log(`Événement article-updated publié pour l'article ID: ${article.id}`);
  } catch (error) {
    console.error('Erreur lors de la publication de l\'événement article-updated:', error);
    throw error;
  }
}

// Fonction pour publier un événement de suppression d'article
async function publishArticleDeleted(articleId) {
  try {
    await producer.send({
      topic: ARTICLE_DELETED_TOPIC,
      messages: [
        {
          key: articleId,
          value: JSON.stringify({ id: articleId }),
          headers: {
            'event-type': 'article-deleted',
            'timestamp': Date.now().toString()
          }
        }
      ]
    });
    console.log(`Événement article-deleted publié pour l'article ID: ${articleId}`);
  } catch (error) {
    console.error('Erreur lors de la publication de l\'événement article-deleted:', error);
    throw error;
  }
}

// Fonction pour publier un événement de mise à jour de stock
async function publishStockUpdated(articleId, newStock) {
  try {
    await producer.send({
      topic: STOCK_UPDATED_TOPIC,
      messages: [
        {
          key: articleId,
          value: JSON.stringify({ id: articleId, stock: newStock }),
          headers: {
            'event-type': 'stock-updated',
            'timestamp': Date.now().toString()
          }
        }
      ]
    });
    console.log(`Événement stock-updated publié pour l'article ID: ${articleId}, nouveau stock: ${newStock}`);
  } catch (error) {
    console.error('Erreur lors de la publication de l\'événement stock-updated:', error);
    throw error;
  }
}

// Consommateur pour les événements d'article
const consumer = kafka.consumer({ groupId: 'article-service-group' });

// Fonction pour se connecter au consommateur Kafka et s'abonner aux topics pertinents
async function connectConsumer() {
  try {
    await consumer.connect();
    console.log('Consommateur Kafka connecté');
    
    // S'abonner à tous les topics nécessaires
    await consumer.subscribe({ topics: [STOCK_UPDATED_TOPIC], fromBeginning: true });
    
    // Définir le handler pour les messages entrants
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const key = message.key ? message.key.toString() : null;
        const value = message.value ? JSON.parse(message.value.toString()) : null;
        const headers = message.headers ? Object.entries(message.headers).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {}) : {};
        
        console.log(`Message reçu du topic ${topic}: ${JSON.stringify(value)}`);
        
        // Traiter les différents types d'événements
        if (topic === STOCK_UPDATED_TOPIC) {
          // Traitement spécifique pour les mises à jour de stock
          console.log(`Mise à jour du stock pour l'article ${value.id} à ${value.stock}`);
          // Logique de mise à jour du stock dans la base de données
          // Cette logique serait implémentée dans un service dédié
        }
      }
    });
  } catch (error) {
    console.error('Erreur de connexion au consommateur Kafka:', error);
    throw error;
  }
}

// Fonction pour se déconnecter de Kafka
async function disconnect() {
  await producer.disconnect();
  await consumer.disconnect();
  console.log('Déconnexion de Kafka réussie');
}

module.exports = {
  connectProducer,
  connectConsumer,
  disconnect,
  publishArticleCreated,
  publishArticleUpdated,
  publishArticleDeleted,
  publishStockUpdated
};