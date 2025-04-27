# 📊✨ TP6 — Intégration et Manipulation de Données avec Apache Kafka & Node.js

## 📚 Matière : SOA et Microservices

👩‍🏫 **Enseignant :** Dr. Salah Gontara  
🎓 **Année universitaire :** 2024/2025  
🖥️ **Classe :** 4Info

---

## 🎯 Objectifs du TP

🚀 Ce TP a pour but de :

- 📦 Installer et configurer **Apache Kafka** et **Zookeeper**
- ⚙️ Intégrer Kafka avec une application **Node.js**
- 📤 Produire des messages sur un topic Kafka
- 📥 Consommer ces messages et les sauvegarder dans **MongoDB**
- 🌐 Créer une **API REST** avec **Express.js** pour consulter les messages stockés
- 🧪 Tester le tout avec **Postman**

---

## 🛠️ Technologies & Outils Utilisés

| 🔧 Outil     | 📌 Version / Type          |
| :----------- | :------------------------- |
| Apache Kafka | 3.9.0                      |
| Zookeeper    | Intégré avec Kafka         |
| Node.js      | v20+                       |
| KafkaJS      | Latest (Node Kafka Client) |
| MongoDB      | Community Edition          |
| Express.js   | Framework REST API         |
| Postman      | Tests HTTP                 |

---

📦 Installation pas à pas

📥 Prérequis :
Node.js

MongoDB Community

Apache Kafka 3.9.0

Postman (optionnel)

📥 Dépendances Node.js :

```bash
npm install express mongoose kafkajs
```

⚙️ Configuration détaillée
📡 Kafka & Zookeeper :
Démarrer Zookeeper :

```bash
bin/windows/zookeeper-server-start.bat config/zookeeper.properties
```

Démarrer Kafka :

```bash
bin/windows/kafka-server-start.bat config/server.properties
```

Créer le topic :

```bash
bin/windows/kafka-topics.bat --create --partitions 1 --replication-factor 1 --topic test-topic --bootstrap-server localhost:9092
```

🗄️ MongoDB :
Démarrer le service :

```bash
net start MongoDB
```

## 📂 Structure du Projet

TP6_SOA_Kafka/
├── producer.js
├── consumer.js
├── api.js
├── package.json
├── /package-lock.json
├── node_modules/
└── README.md

📝 Explication du code
📤 producer.js :
Envoie un message toutes les 2 secondes à Kafka

Utilisation de KafkaJS

```js
{
  "name": "tp6_soa_kafka",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^5.1.0",
    "kafkajs": "^2.2.4",
    "mongoose": "^8.13.2"
  }
}

```

📥 consumer.js :
Consomme les messages depuis Kafka

Les sauvegarde dans MongoDB

Utilisation de Mongoose

```JS
const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/kafka_messages', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Définir le schéma pour les messages
const messageSchema = new mongoose.Schema({
  value: String,
  timestamp: { type: Date, default: Date.now }
});

// Créer le modèle
const Message = mongoose.model('Message', messageSchema);

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'db-group' });

const run = async () => {
  // Connecter le consommateur
  await consumer.connect();

  // S'abonner au topic
  await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

  // Configurer le traitement des messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      // Convertir le message en chaîne
      const messageValue = message.value.toString();
      console.log(`Message reçu: ${messageValue}`);

      // Enregistrer dans MongoDB
      try {
        const newMessage = new Message({ value: messageValue });
        await newMessage.save();
        console.log('Message enregistré dans la base de données');
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement dans MongoDB:', error);
      }
    },
  });
};

// Exécuter la fonction principale
run().catch(console.error);
```

🌐 api.js :
Crée une API REST avec Express.js

Permet de consulter les messages depuis MongoDB via HTTP

```js
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = 3000;

// Connexion à MongoDB
mongoose
  .connect("mongodb://localhost:27017/kafka_messages", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("API connectée à MongoDB"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

// Définir le schéma pour les messages
const messageSchema = new mongoose.Schema({
  value: String,
  timestamp: { type: Date, default: Date.now },
});

// Créer le modèle
const Message = mongoose.model("Message", messageSchema);

// Middleware pour parser le JSON
app.use(express.json());

// Route pour obtenir tous les messages
app.get("/api/messages", async (req, res) => {
  try {
    // Récupérer tous les messages, triés par date décroissante
    const messages = await Message.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des messages" });
  }
});

// Route pour obtenir un message spécifique par ID
app.get("/api/messages/:id", async (req, res) => {
  try {
    // Récupérer un message par son ID
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message non trouvé" });
    }
    res.json(message);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du message" });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`API REST démarrée sur http://localhost:${port}`);
});
```

🚀 Exécution du système

1️⃣ Démarrer Zookeeper & Kafka

2️⃣ Démarrer MongoDB

3️⃣ Lancer l’API REST :

```bash
node api.js
```

4️⃣ Lancer le consommateur :

```bash
node consumer.js
```

5️⃣ Lancer le producteur :

```bash
node producer.js

```

🌐 API REST et endpoints

Méthode Endpoint Description
GET /api/messages Récupérer tous les messages
GET /api/messages/:id Récupérer un message par ID

🧪 Tests et vérifications
✅ Via Postman :

GET http://localhost:3000/api/messages

![img](img1.png)

✅ Via MongoDB Compass

![img](img2.png)

![img](img3.png)

✅ Console : logs de production et consommation

📚 Ressources utiles
Kafka Documentation

KafkaJS

Mongoose

Express.js

MongoDB

📜 Auteur

👤 Samah Saidi

4Info - Classe DS1

📧 Contact: samah.saidi@polytechnicien.tn

🔗 GitHub: https://github.com/samah-saidi
