const { Kafka } = require('kafkajs');

// Configuration de Kafka
const kafka = new Kafka({
  clientId: 'category-service',
  brokers: ['kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Producteur pour les événements de catégorie
const producer = kafka.producer();

// Topics Kafka pour les événements de catégorie
const CATEGORY_CREATED_TOPIC = 'category-created';
const CATEGORY_UPDATED_TOPIC = 'category-updated';
const CATEGORY_DELETED_TOPIC = 'category-deleted';

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

// Fonction pour publier un événement de création de catégorie
async function publishCategoryCreated(category) {
  try {
    await producer.send({
      topic: CATEGORY_CREATED_TOPIC,
      messages: [
        {
          key: category.id,
          value: JSON.stringify(category),
          headers: {
            'event-type': 'category-created',
            'timestamp': Date.now().toString()
          }
        }
      ]
    });
    console.log(`Événement category-created publié pour la catégorie ID: ${category.id}`);
  } catch (error) {
    console.error('Erreur lors de la publication de l\'événement category-created:', error);
    throw error;
  }
}

// Fonction pour publier un événement de mise à jour de catégorie
async function publishCategoryUpdated(category) {
  try {
    await producer.send({
      topic: CATEGORY_UPDATED_TOPIC,
      messages: [
        {
          key: category.id,
          value: JSON.stringify(category),
          headers: {
            'event-type': 'category-updated',
            'timestamp': Date.now().toString()
          }
        }
      ]
    });
    console.log(`Événement category-updated publié pour la catégorie ID: ${category.id}`);
  } catch (error) {
    console.error('Erreur lors de la publication de l\'événement category-updated:', error);
    throw error;
  }
}

// Fonction pour publier un événement de suppression de catégorie
async function publishCategoryDeleted(categoryId) {
  try {
    await producer.send({
      topic: CATEGORY_DELETED_TOPIC,
      messages: [
        {
          key: categoryId,
          value: JSON.stringify({ id: categoryId }),
          headers: {
            'event-type': 'category-deleted',
            'timestamp': Date.now().toString()
          }
        }
      ]
    });
    console.log(`Événement category-deleted publié pour la catégorie ID: ${categoryId}`);
  } catch (error) {
    console.error('Erreur lors de la publication de l\'événement category-deleted:', error);
    throw error;
  }
}

// Consommateur pour les événements de catégorie
const consumer = kafka.consumer({ groupId: 'category-service-group' });

// Fonction pour se connecter au consommateur Kafka et s'abonner aux topics pertinents
async function connectConsumer() {
  try {
    await consumer.connect();
    console.log('Consommateur Kafka connecté');
    
    // S'abonner aux topics appropriés
    await consumer.subscribe({ topics: [CATEGORY_CREATED_TOPIC, CATEGORY_UPDATED_TOPIC, CATEGORY_DELETED_TOPIC], fromBeginning: true });
    
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
        switch (topic) {
          case CATEGORY_CREATED_TOPIC:
            console.log(`Nouvelle catégorie créée: ${value.nom}`);
            break;
          case CATEGORY_UPDATED_TOPIC:
            console.log(`Catégorie mise à jour: ${value.nom}`);
            break;
          case CATEGORY_DELETED_TOPIC:
            console.log(`Catégorie supprimée: ${value.id}`);
            break;
          default:
            console.log(`Topic inconnu: ${topic}`);
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
  publishCategoryCreated,
  publishCategoryUpdated,
  publishCategoryDeleted
};