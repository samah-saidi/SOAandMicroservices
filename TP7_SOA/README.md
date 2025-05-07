# 🎬 TP7 : Microservices avec REST, GraphQL, gRPC et Kafka 📡

![Microservices Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![REST API](https://img.shields.io/badge/API-REST-green)
![GraphQL](https://img.shields.io/badge/API-GraphQL-pink)
![gRPC](https://img.shields.io/badge/Protocol-gRPC-orange)
![Kafka](https://img.shields.io/badge/Queue-Kafka-red)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)

## 📋 Présentation du projet

Ce projet implémente une architecture de microservices pour gérer un système de streaming contenant des films et des séries TV. L'architecture utilise des technologies modernes comme gRPC pour la communication entre microservices, Kafka pour la communication asynchrone événementielle, et expose les données aux clients via des API REST et GraphQL.


## 🏗️ Architecture

![alt text](image.png)

Ce diagramme illustre l'architecture du système :
1. L'API Gateway agit comme point d'entrée unique pour les clients
2. Les requêtes des clients sont traduites en appels gRPC vers les microservices appropriés
3. Les microservices communiquent entre eux via Kafka pour des opérations asynchrones
4. Chaque microservice gère sa propre base de données MongoDB

## 🚀 Fonctionnalités

- ✅ API REST pour les films et les séries TV
- ✅ API GraphQL pour des requêtes flexibles et efficaces
- ✅ Communication inter-services synchrone avec gRPC
- ✅ Messaging asynchrone et découplé avec Kafka
- ✅ Persistance des données avec MongoDB
- ✅ Opérations CRUD complètes sur les films et séries TV
- ✅ Gestion robuste des erreurs et validation des données

## 🛠️ Technologies utilisées

- **Backend** : Node.js (v14+), Express
- **API** : REST, GraphQL (Apollo Server v4)
- **Communication synchrone** : gRPC avec Protocol Buffers
- **Messaging asynchrone** : Apache Kafka
- **Base de données** : MongoDB
- **Gestion des erreurs** : Stratégies de retry et circuit breaker patterns

## 💻 Structure du projet

```
TP7_SOA/
├── movies/
│   ├── movie.proto                  # Définition du service gRPC pour les films
│   └── movieMicroservice.js         # Microservice des films avec MongoDB
├── node_modules/                    # Dépendances Node.js
├── tvShow/
│   ├── tvShow.proto                 # Définition du service gRPC pour les séries TV
│   └── tvShowMicroservice.js        # Microservice des séries TV avec MongoDB
├── apiGateway.js                    # API Gateway avec REST et GraphQL
├── package-lock.json                # Verrouillage des versions des dépendances
├── package.json                     # Configuration du projet Node.js
├── resolvers.js                     # Résolveurs GraphQL
└── schema.js                        # Schéma GraphQL
```

## 🔧 Installation et configuration

### Prérequis

- Node.js (v14+)
- MongoDB (v4+)
- Apache Kafka & Zookeeper (v2.8+)

### Installation des dépendances

```bash
npm install express @apollo/server @grpc/grpc-js @grpc/proto-loader body-parser cors kafkajs mongoose
```

### Configuration de Kafka (Windows)

```bash
# Démarrer Zookeeper
.\bin\windows\zookeeper-server-start.bat .\config\zookeeper.properties

# Démarrer Kafka dans un autre terminal
.\bin\windows\kafka-server-start.bat .\config\server.properties

# Créer les topics nécessaires
.\bin\windows\kafka-topics.bat --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic movies_topic
.\bin\windows\kafka-topics.bat --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic tvshows_topic
```

### Configuration de Kafka (Linux/macOS)

```bash
# Démarrer Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# Démarrer Kafka dans un autre terminal
bin/kafka-server-start.sh config/server.properties

# Créer les topics nécessaires
bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic movies_topic
bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic tvshows_topic
```

## 🚦 Démarrage des services

### 1. Démarrer MongoDB
```bash
mongod --dbpath /data/db
```

### 2. Démarrer les microservices (dans des terminaux séparés)
```bash
# Microservice Films
node movies/movieMicroservice.js

# Microservice Séries TV
node tvShow/tvShowMicroservice.js

# API Gateway
node apiGateway.js
```

Une fois tous les services démarrés, vous devriez voir des messages de confirmation dans les terminaux indiquant que les serveurs sont en écoute sur leurs ports respectifs.

## 📊 Test de l'application

### API REST

- 🔍 **GET** `/movies` : Liste tous les films
  - Paramètre optionnel: `?query=title` pour rechercher par titre
- 🔍 **GET** `/movies/:id` : Récupère un film par ID
- ➕ **POST** `/movies` : Crée un nouveau film
  - Corps de la requête: `{ "id": "123", "title": "Film Title", "description": "Description" }`
- 🔄 **PUT** `/movies/:id` : Met à jour un film existant
  - Corps de la requête: `{ "title": "New Title", "description": "New Description" }`
- ❌ **DELETE** `/movies/:id` : Supprime un film

> *Les mêmes opérations sont disponibles pour les séries TV avec le préfixe `/tvshows`*

### API GraphQL

Accédez à l'interface GraphQL via http://localhost:3000/graphql

**Exemples de requêtes** :
```graphql
# Récupérer tous les films
query {
  movies {
    id
    title
    description
  }
}

# Récupérer un film par ID
query {
  movie(id: "123") {
    title
    description
  }
}

# Créer un film
mutation {
  createMovie(id: "123", title: "Inception", description: "Un film sur les rêves") {
    id
    title
    description
  }
}

# Mettre à jour un film
mutation {
  updateMovie(id: "123", title: "Inception 2.0", description: "La suite du film sur les rêves") {
    id
    title
    description
  }
}

# Supprimer un film
mutation {
  deleteMovie(id: "123") {
    message
  }
}
```

## 💡 Concepts clés mis en œuvre

- **Séparation des responsabilités** : Chaque microservice gère un domaine métier spécifique
- **API Gateway** : Point d'entrée unique qui simplifie l'interface client
- **Communication synchrone et asynchrone** : gRPC pour les requêtes directes, Kafka pour les événements
- **Persistence polyglotte** : Chaque service peut utiliser le type de stockage qui lui convient le mieux
- **Résilience** : Les services peuvent continuer à fonctionner même si d'autres sont indisponibles

## 📝 Intégration de Kafka

### Code pour un producteur Kafka

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const sendMessage = async (topic, message) => {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
  await producer.disconnect();
};

// Exemple d'utilisation dans l'API Gateway
app.post('/movies', async (req, res) => {
  const movieData = req.body;
  await sendMessage('movies_topic', movieData);
  res.send({ message: 'Movie created', data: movieData });
});
```

### Code pour un consommateur Kafka

```javascript
const consumer = kafka.consumer({ groupId: 'group-id' });

const consumeMessages = async (topic) => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Received message: ${message.value.toString()}`);
      // Traitez le message ici
    },
  });
};

// Démarrer la consommation des messages
consumeMessages('movies_topic');
```

