# TP8 : Microservices avec API Gateway Dynamique

## Architecture du projet

Ce projet met en œuvre une architecture de microservices avec Kong comme API Gateway dynamique en mode DB-less. L'architecture comprend :

- **Service A (Users)** : Un microservice Node.js exposant des données utilisateurs
- **Service B (Products)** : Un microservice Node.js exposant des données de produits
- **Kong API Gateway** : Un gateway configuré en mode déclaratif pour router les requêtes vers les services appropriés

## Structure du projet

```
tp-kong/
├── service-a/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
├── service-b/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
├── kong.yml
├── docker-compose.yml
└── README.md
```

## Prérequis

- Docker et Docker Compose installés
- Node.js v22 et npm (pour le développement local)
- Un outil pour tester les API REST (curl, Postman, etc.)

## Composants du projet

### 1. Service A (Users)

Service simple exposant une API REST pour accéder à des données utilisateurs.

- **Port** : 3001
- **Endpoint** : GET /
- **Réponse** : Liste des utilisateurs au format JSON

### 2. Service B (Products)

Service simple exposant une API REST pour accéder à des données de produits.

- **Port** : 3002
- **Endpoint** : GET /
- **Réponse** : Liste des produits au format JSON

### 3. Kong API Gateway

Kong est configuré en mode DB-less avec un fichier de configuration déclaratif (kong.yml).

- **Port du proxy** : 8000
- **Port de l'API Admin** : 8001
- **Routes configurées** :
  - `/users` → Service A
  - `/products` → Service B

## 📄 Fichiers importants

### service-a/index.js

```javascript
const express = require("express");
const app = express();
const PORT = 3001;
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

app.get("/", (req, res) => res.json(users));

app.listen(PORT, () => console.log(`Service A running on port ${PORT}`));
```

### service-b/index.js

```javascript
const express = require("express");
const app = express();
const PORT = 3002;
const products = [
  { id: 1, name: "Laptop", price: 999 },
  { id: 2, name: "Phone", price: 699 },
];

app.get("/", (req, res) => res.json(products));

app.listen(PORT, () => console.log(`Service B running on port ${PORT}`));
```

### Dockerfile (pour les deux services)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY index.js ./
EXPOSE 3001  # 3002 pour service-b
CMD ["node", "index.js"]
```

### kong.yml

```yaml
_format_version: "1.1"
services:
  - name: service-a
    url: http://service-a:3001
    routes:
      - name: users-route
        paths: ["/users"]
  - name: service-b
    url: http://service-b:3002
    routes:
      - name: products-route
        paths: ["/products"]
```

### docker-compose.yml

```yaml
services:
  service-a:
    build: ./service-a
    container_name: TP8_SOA_kong-service-a
    networks:
      - kong-net
    restart: unless-stopped

  service-b:
    build: ./service-b
    container_name: TP8_SOA_kong-service-b
    networks:
      - kong-net
    restart: unless-stopped

  kong:
    image: kong:latest
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /etc/kong/kong.yml
    volumes:
      - ./kong.yml:/etc/kong/kong.yml:ro
    ports:
      - "8000:8000" # Proxy
      - "8001:8001" # Admin API
    networks:
      - kong-net

networks:
  kong-net:
    driver: bridge
```

### 🚀 Lancer les conteneurs avec Docker Compose

```bash
docker compose up -d --build
```

Cette commande va :

- Construire les images Docker pour les services A et B
- Télécharger l'image de Kong si nécessaire
- Créer et démarrer les conteneurs
- Configurer le réseau entre les services

### 🚀 Vérifier l'état des conteneurs

```bash
docker compose ps
```

Tous les services doivent être à l'état "Up".

### 🚀 Tester les endpoints via Kong

#### Accès au service A (Users)

```bash
curl http://localhost:8000/users
```

Réponse attendue :

```json
[
  { "id": 1, "name": "Alice" },
  { "id": 2, "name": "Bob" }
]
```

#### Accès au service B (Products)

```bash
curl http://localhost:8000/products
```

Réponse attendue :

```json
[
  { "id": 1, "name": "Smartphone", "price": 699.99 },
  { "id": 2, "name": "Laptop", "price": 1299.99 },
  { "id": 3, "name": "Headphones", "price": 199.99 }
]
```

### 5. Explorer l'API Admin de Kong

Pour lister les services configurés :

```bash
curl http://localhost:8001/services
```

Pour lister les routes configurées :

```bash
curl http://localhost:8001/routes
```

## Explications techniques

### Mode DB-less de Kong

Dans ce projet, Kong est configuré en mode DB-less, ce qui signifie qu'il n'utilise pas de base de données pour stocker sa configuration. À la place, il utilise un fichier de configuration déclaratif (kong.yml) monté dans le conteneur.

Avantages du mode DB-less :

- Configuration plus simple et portable
- Pas besoin de gérer une BDD séparée
- La configuration peut être versionnée dans Git

### Routage dynamique

Le routage est configuré dans le fichier kong.yml, avec deux routes principales :

- `/users` qui redirige vers le Service A (Users)

- `/products` qui redirige vers le Service B (Products)

L'option `strip_path: true` permet de supprimer le préfixe avant de rediriger la requête au service concerné.

### Réseau Docker

Tous les services sont connectés au même réseau Docker `kong-net`, ce qui leur permet de communiquer entre eux en utilisant les noms des services comme noms d'hôtes.

## Arrêt des services

Pour arrêter tous les services :

```bash
docker compose down
```

Pour supprimer également les volumes et les images :

```bash
docker compose down -v --rmi all
```
