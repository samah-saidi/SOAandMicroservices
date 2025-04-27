const { Kafka } = require('kafkajs');

// Configuration de la connexion à Kafka
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

// Fonction pour générer un message aléatoire
function generateRandomMessage() {
  const messages = [
    "Message important du système",
    "Alerte de sécurité",
    "Mise à jour disponible",
    "Nouvel utilisateur enregistré",
    "Transaction complétée"
  ];
  
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex] + " #" + Math.floor(Math.random() * 1000);
}

// Fonction principale
const run = async () => {
  // Connecter le producteur
  await producer.connect();
  
  // Envoyer un message toutes les 2 secondes
  setInterval(async () => {
    try {
      // Générer un message aléatoire
      const messageValue = generateRandomMessage();
      
      // Envoyer le message au topic
      await producer.send({
        topic: 'test-topic',
        messages: [
          { value: messageValue },
        ],
      });
      console.log('Message produit avec succès:', messageValue);
    } catch (err) {
      console.error("Erreur lors de la production de message", err);
    }
  }, 2000);
};

// Exécuter la fonction principale
run().catch(console.error);