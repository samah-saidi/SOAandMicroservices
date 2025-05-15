# Projet Décoration SOA – Microservices

## Sommaire
- [Présentation](#présentation)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Démarrage des services](#démarrage-des-services)
- [Utilisation du front de test](#utilisation-du-front-de-test)
- [Tests Kafka](#tests-kafka)
- [Tests Authentification](#tests-authentification)
- [Dépannage](#dépannage)
- [Auteurs](#auteurs)
- [Exemples de requêtes Postman](#exemples-de-requêtes-postman)

---

## Présentation

Ce projet est une application de démonstration d'architecture microservices pour la gestion de produits de décoration.  
Il utilise :
- **Node.js** pour les microservices
- **gRPC** pour la communication inter-services
- **Kafka** pour la gestion d'événements asynchrones
- **MongoDB** pour la persistance
- **API Gateway** pour centraliser les appels
- **Front-end HTML/JS** pour tester les fonctionnalités

---

## Architecture

### Vue d'ensemble
```
+-------------------+         +-------------------+         +-------------------+
|                   |         |                   |         |                   |
|  API Gateway      +-------->+  Auth Service     |         |  Product Service  |
|  (Express, port   |         |  (gRPC, port 50051|         |  (gRPC, port 50055|
|   4000)           |         |   MongoDB)        |         |   MongoDB)        |
+--------+----------+         +-------------------+         +-------------------+
         |                                                    
         |                                                    
         v                                                    
+-------------------+                                         
|                   |                                         
|  Decoration       |                                         
|  Service          |                                         
|  (gRPC, port      |                                         
|   50053, MongoDB) |                                         
+--------+----------+                                         
         |                                                    
         v                                                    
+-------------------+                                         
|                   |                                         
|  Kafka (9092)     |<-----------------------------------------+
|  (broker)         |           (events: gateway, product, decoration)
+-------------------+                                         
         ^                                                    
         |                                                    
+--------+----------+                                         
|                   |                                         
|  Front-end HTML   |                                         
|  (localhost:3000) |                                         
+-------------------+                                         
|                   |                                         
|  Cart Service     |                                         
|  (gRPC, 50054)    |                                         
|  MongoDB          |                                         
+-------------------+                                         
```

### Composants Principaux

#### 1. API Gateway (Port 4000)
- **Technologies**: Express.js, Apollo Server
- **Fonctionnalités**:
  - Point d'entrée unique pour tous les clients
  - Support REST et GraphQL
  - Gestion de l'authentification
  - Routage des requêtes vers les microservices
  - Publication d'événements Kafka

#### 2. Services Microservices (gRPC)

##### Auth Service (Port 50051)
- **Fonctionnalités**:
  - Inscription utilisateur
  - Connexion
  - Validation de token
- **Sécurité**: JWT
- **Événements**: Publication des événements d'authentification

##### Cart Service (Port 50054)
- **Fonctionnalités**:
  - Ajout au panier
  - Suppression du panier
  - Consultation du panier
- **Stockage**: In-memory (extensible vers MongoDB)

##### Product Service (Port 50055)
- **Fonctionnalités**:
  - CRUD produits
  - Recherche de produits
  - Gestion des catégories
- **Base de données**: MongoDB

##### Decoration Service (Port 50053)
- **Fonctionnalités**:
  - CRUD articles de décoration
  - Filtrage par style et matériau
  - Filtrage par gamme de prix
- **Base de données**: MongoDB

#### 3. Système d'Événements (Kafka)
- **Port**: 9092
- **Topics**:
  - `gateway_events`
  - `product_events`
  - `decoration_events`
  - `auth_events`

### Flux de Communication

1. **Flux d'Authentification**
```
Client → API Gateway → Auth Service → JWT Token
                      ↓
                  Kafka Events
```

2. **Flux de Gestion des Produits**
```
Client → API Gateway → Product Service → MongoDB
                      ↓
                  Kafka Events
```

3. **Flux de Gestion du Panier**
```
Client → API Gateway → Cart Service → In-memory Storage
```

4. **Flux de Gestion de la Décoration**
```
Client → API Gateway → Decoration Service → MongoDB
                      ↓
                  Kafka Events
```

### Sécurité
- Authentification basée sur JWT
- Contrôle d'accès basé sur les rôles (admin/client)
- Gestion sécurisée des mots de passe
- Middleware de validation des tokens

### Composants de Test
- Interface frontend de test (Port 3000)
- Test des messages Kafka
- Test d'authentification
- Test des API REST via Postman

### Pipeline CI/CD

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │     │                 │
│  Développement  │────▶│     Tests       │────▶│    Build        │────▶│   Déploiement   │
│                 │     │                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │                       │
        │                       │                       │                       │
        ▼                       ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │     │                 │
│  Git Flow       │     │  Unit Tests     │     │  Docker Images  │     │  Kubernetes     │
│  Feature Branch │     │  Integration    │     │  NPM Packages   │     │  Helm Charts    │
│  PR Review      │     │  E2E Tests      │     │  Proto Files    │     │  Monitoring     │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

#### 1. Développement
- **Git Flow**
  - Feature branches pour chaque nouvelle fonctionnalité
  - Pull Requests avec revue de code
  - Merge vers develop après approbation
- **Standards de Code**
  - ESLint pour le linting
  - Prettier pour le formatage
  - Documentation des API avec JSDoc

#### 2. Tests
- **Tests Unitaires**
  - Jest pour les tests unitaires
  - Couverture de code > 80%
- **Tests d'Intégration**
  - Tests gRPC
  - Tests Kafka
  - Tests MongoDB
- **Tests E2E**
  - Tests API REST
  - Tests GraphQL
  - Tests d'authentification

### Tests des Fichiers Proto

#### 1. Installation des Outils
```bash
# Installation de grpcurl pour tester les services gRPC
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# Installation de protoc (protobuf compiler)
# Pour Windows (avec Chocolatey)
choco install protoc

# Pour Linux
apt-get install protobuf-compiler

# Pour macOS
brew install protobuf
```

#### 2. Vérification de la Syntaxe
```bash
# Vérifier la syntaxe d'un fichier proto
protoc --proto_path=. --descriptor_set_out=service.pb service.proto
```

#### 3. Tests avec grpcurl

##### Auth Service (Port 50051)
```bash
# Lister les services disponibles
grpcurl -plaintext localhost:50051 list

# Lister les méthodes du service d'authentification
grpcurl -plaintext localhost:50051 list auth.AuthService

# Tester la méthode login
grpcurl -plaintext -d '{"username": "admin", "password": "admin123"}' \
  localhost:50051 auth.AuthService/login

# Tester la méthode register
grpcurl -plaintext -d '{
  "username": "testuser",
  "email": "test@example.com",
  "password": "test123",
  "role": "customer"
}' localhost:50051 auth.AuthService/register
```

##### Cart Service (Port 50054)
```bash
# Tester l'ajout au panier
grpcurl -plaintext -d '{
  "userId": "user1",
  "productId": "prod1",
  "quantity": 2
}' localhost:50054 CartService/AddToCart

# Tester la récupération du panier
grpcurl -plaintext -d '{"userId": "user1"}' \
  localhost:50054 CartService/GetCart
```

##### Product Service (Port 50055)
```bash
# Tester la recherche de produits
grpcurl -plaintext -d '{
  "query": "table",
  "category": "furniture",
  "min_price": 100,
  "max_price": 500
}' localhost:50055 ProductService/searchProducts

# Tester la récupération d'un produit
grpcurl -plaintext -d '{"product_id": "prod1"}' \
  localhost:50055 ProductService/getProduct
```

##### Decoration Service (Port 50053)
```bash
# Tester la recherche d'articles de décoration
grpcurl -plaintext -d '{
  "query": "vase",
  "style": "modern",
  "material": "ceramic",
  "min_price": 50,
  "max_price": 200
}' localhost:50053 DecorationService/searchDecorationArticles
```

#### 4. Tests Automatisés

##### Exemple de Test avec Jest
```javascript
// test/proto.test.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

describe('Proto Tests', () => {
  let client;

  beforeAll(() => {
    const PROTO_PATH = path.join(__dirname, '../auth.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH);
    const proto = grpc.loadPackageDefinition(packageDefinition).auth;
    client = new proto.AuthService(
      'localhost:50051',
      grpc.credentials.createInsecure()
    );
  });

  test('Login should return token', (done) => {
    client.login(
      { username: 'admin', password: 'admin123' },
      (err, response) => {
        expect(err).toBeNull();
        expect(response.token).toBeDefined();
        done();
      }
    );
  });
});
```

#### 5. Bonnes Pratiques

1. **Validation des Messages**
   - Utiliser des validations strictes dans les fichiers proto
   - Définir des règles de validation pour les champs requis
   - Spécifier les types de données appropriés

2. **Documentation**
   - Ajouter des commentaires pour chaque service et méthode
   - Documenter les paramètres et les retours
   - Inclure des exemples d'utilisation

3. **Versioning**
   - Utiliser la versioning sémantique pour les fichiers proto
   - Maintenir la compatibilité ascendante
   - Documenter les changements de version

4. **Tests de Performance**
   - Tester les temps de réponse
   - Vérifier la gestion des erreurs
   - Tester la charge avec plusieurs clients simultanés

### Tests avec Postman

#### 1. Configuration de Postman pour gRPC

1. **Installation**
   - Télécharger et installer [Postman](https://www.postman.com/downloads/)
   - Installer l'extension gRPC dans Postman

2. **Configuration du Workspace**
   - Créer un nouveau workspace "Decoration SOA"
   - Importer les fichiers proto dans Postman
   - Configurer les variables d'environnement pour les ports

#### 2. Tests des Services

##### Auth Service (Port 50051)
```json
// Configuration de la requête
{
  "method": "auth.AuthService/login",
  "host": "localhost:50051",
  "request": {
    "username": "admin",
    "password": "admin123"
  }
}

// Configuration de l'inscription
{
  "method": "auth.AuthService/register",
  "host": "localhost:50051",
  "request": {
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123",
    "role": "customer"
  }
}
```

##### Cart Service (Port 50054)
```json
// Ajout au panier
{
  "method": "CartService/AddToCart",
  "host": "localhost:50054",
  "request": {
    "userId": "user1",
    "productId": "prod1",
    "quantity": 2
  }
}

// Récupération du panier
{
  "method": "CartService/GetCart",
  "host": "localhost:50054",
  "request": {
    "userId": "user1"
  }
}
```

##### Product Service (Port 50055)
```json
// Recherche de produits
{
  "method": "ProductService/searchProducts",
  "host": "localhost:50055",
  "request": {
    "query": "table",
    "category": "furniture",
    "min_price": 100,
    "max_price": 500
  }
}

// Récupération d'un produit
{
  "method": "ProductService/getProduct",
  "host": "localhost:50055",
  "request": {
    "product_id": "prod1"
  }
}
```

##### Decoration Service (Port 50053)
```json
// Recherche d'articles de décoration
{
  "method": "DecorationService/searchDecorationArticles",
  "host": "localhost:50053",
  "request": {
    "query": "vase",
    "style": "modern",
    "material": "ceramic",
    "min_price": 50,
    "max_price": 200
  }
}
```

#### 3. Collections Postman

1. **Création de Collections**
   - Créer une collection pour chaque service
   - Organiser les requêtes par fonctionnalité
   - Ajouter des tests automatiques

2. **Variables d'Environnement**
```json
{
  "auth_service": "localhost:50051",
  "cart_service": "localhost:50054",
  "product_service": "localhost:50055",
  "decoration_service": "localhost:50053",
  "api_gateway": "localhost:4000"
}
```

3. **Tests Automatisés**
```javascript
// Exemple de test pour l'authentification
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData.token).to.exist;
    pm.expect(jsonData.user).to.exist;
});

// Exemple de test pour le panier
pm.test("Cart updated", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.items).to.be.an('array');
});
```

#### 4. Exécution des Tests

1. **Tests Manuels**
   - Ouvrir Postman
   - Sélectionner la collection
   - Choisir l'environnement
   - Exécuter les requêtes

2. **Tests Automatisés**
   - Utiliser le runner de Postman
   - Configurer les itérations
   - Exporter les rapports

3. **Monitoring**
   - Vérifier les temps de réponse
   - Analyser les erreurs
   - Générer des rapports

#### 5. Bonnes Pratiques

1. **Organisation**
   - Créer des collections par service
   - Utiliser des variables d'environnement
   - Documenter les requêtes

2. **Tests**
   - Ajouter des tests pour chaque requête
   - Vérifier les cas d'erreur
   - Tester les limites

3. **Sécurité**
   - Gérer les tokens d'authentification
   - Tester les autorisations
   - Vérifier les validations

4. **Performance**
   - Mesurer les temps de réponse
   - Tester la charge
   - Analyser les goulots d'étranglement

---

## Prérequis

- **Node.js** (v18+ recommandé)
- **npm**
- **MongoDB** (en local ou distant)
- **Kafka** (en local ou via Docker)
- **git** (pour cloner le projet)

---

## Installation

1. **Clone le projet**
   ```bash
   git clone <url-du-repo>
   cd ProjetDecoration_SOA
   ```

2. **Installe les dépendances pour chaque service**
   ```bash
   cd auth-service
   npm install
   cd ../product-service
   npm install
   cd ../decoration-service
   npm install
   cd ..
   cd api-gateway
   npm install
   ```

3. **Vérifie que MongoDB et Kafka sont démarrés**

---

## Démarrage des services

Dans différents terminaux :

1. **Auth Service**
   ```bash
   cd auth-service
   node authMicroservice.js
   ```

2. **Product Service**
   ```bash
   cd product-service
   node productMicroservice.js
   ```

3. **Decoration Service**
   ```bash
   cd decoration-service
   node decorationMicroservice.js
   ```

4. **API Gateway**
   ```bash
   cd api-gateway
   node apiGateway.js
   ```

5. **Front-end de test (Kafka & Auth)**
   ```bash
   cd decoration-service
   node server.js
   ```
   Accède ensuite à [http://localhost:3000](http://localhost:3000)

---

## Utilisation du front de test

- **Section Kafka** :  
  Permet d'envoyer des messages sur les topics Kafka et de voir les messages reçus en temps réel via WebSocket.

- **Section Authentification** :  
  Permet de tester l'inscription (`/auth/register`) et la connexion (`/auth/login`) via l'API Gateway.

---

## Tests Kafka

1. Sélectionne un topic (gateway_events, product_events, decoration_events)
2. Renseigne le type de message et le contenu (en JSON)
3. Clique sur « Envoyer le message »
4. Les messages reçus s'affichent en temps réel

---

## Tests Authentification

1. Renseigne un email et un mot de passe
2. Clique sur « S'inscrire » pour tester l'inscription
3. Clique sur « Se connecter » pour tester la connexion
4. Le résultat s'affiche sous les boutons

---

## Dépannage

- **Erreur EADDRINUSE** :  
  Un port est déjà utilisé.  
  → Trouve le PID avec `netstat -ano | findstr :<port>` puis tue-le avec `taskkill /PID <PID> /F`.

- **Erreur JSON ou page HTML reçue** :  
  Vérifie que l'API Gateway tourne bien sur le port 4000 et que les routes `/auth/register` et `/auth/login` existent.

- **Kafka ne reçoit pas de messages** :  
  Vérifie que le broker Kafka tourne sur le port 9092.

- **MongoDB non connecté** :  
  Vérifie que le service MongoDB est bien démarré.

---

## Auteurs

- [Ton nom]
- [Collaborateurs éventuels]

---

## Exemples de requêtes Postman

### 1. Authentification (Register & Login)

#### Inscription (Register)
- **URL** : `POST http://localhost:4000/auth/register`
- **Body (JSON)** :
```json
{
  "email": "test@example.com",
  "password": "monmotdepasse"
}
```
- **Réponse attendue** :
```json
{
  "success": true,
  "message": "Utilisateur enregistré avec succès"
}
```

#### Connexion (Login)
- **URL** : `POST http://localhost:4000/auth/login`
- **Body (JSON)** :
```json
{
  "email": "test@example.com",
  "password": "monmotdepasse"
}
```
- **Réponse attendue** :
```json
{
  "success": true,
  "token": "<JWT>"
}
```

### 2. Envoi d'un message Kafka via l'API Gateway (si exposé)
- **URL** : `POST http://localhost:3000/send-message`
- **Body (JSON)** :
```json
{
  "topic": "gateway_events",
  "type": "TEST_EVENT",
  "content": { "message": "Ceci est un test" }
}
```
- **Réponse attendue** :
```json
{
  "success": true,
  "message": "Message envoyé avec succès",
  "data": {
    "topic": "gateway_events",
    "type": "TEST_EVENT",
    "content": { "message": "Ceci est un test" },
    "timestamp": "..."
  }
}
```

---

**N'hésite pas à adapter ce README à tes besoins spécifiques !**
Si tu veux un schéma d'architecture graphique ou des exemples de requêtes, demande-moi ! 

# Terminal 1 - Start Kafka (if not already running)
# Make sure Kafka is running on localhost:9092

# Terminal 2 - Start Auth Service
cd auth-service
node authMicroservice.js

# Terminal 3 - Start Cart Service
cd cart-service
node cartServer.js

# Terminal 4 - Start Product Service
cd product-service
node productServer.js

# Terminal 5 - Start Decoration Service
cd decoration-service
node decorationServer.js

# Terminal 6 - Start API Gateway
cd api-gateway
node apiGateway.js


