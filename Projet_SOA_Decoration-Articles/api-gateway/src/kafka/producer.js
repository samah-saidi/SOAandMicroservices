const { Kafka } = require('kafkajs');

// Configuration de Kafka
const kafka = new Kafka({
  clientId: 'api-gateway',
  brokers: ['kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Création du producteur
const producer = kafka.producer();

// Topics Kafka utilisés
const ARTICLE_CREATED_TOPIC = 'article-created';
const ARTICLE_UPDATED_TOPIC = 'article-updated';
const ARTICLE_DELETED_TOPIC = 'article-deleted';
const CATEGORY_CREATED_TOPIC = 'category-created';
const CATEGORY_UPDATED_TOPIC = 'category-updated';
const CATEGORY_DELETED_TOPIC = 'category-deleted';

// Initialisation du producteur
async function initProducer() {
  try {
    await producer.connect();
    console.log('Producteur Kafka connecté avec succès');
  } catch (error) {
    console.error('Erreur lors de la connexion du producteur Kafka:', error);
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

// Fonction pour fermer le producteur
async function closeProducer() {
  try {
    await producer.disconnect();
    console.log('Producteur Kafka déconnecté avec succès');
  } catch (error) {
    console.error('Erreur lors de la déconnexion du producteur Kafka:', error);
  }
}

// Export des fonctions
module.exports = {
  initProducer,
  closeProducer,
  publishArticleCreated,
  publishArticleUpdated,
  publishArticleDeleted,
  publishCategoryCreated,
  publishCategoryUpdated,
  publishCategoryDeleted
};