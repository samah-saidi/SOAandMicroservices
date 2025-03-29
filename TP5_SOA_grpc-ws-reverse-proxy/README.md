💬 Service de Chat gRPC avec Reverse Proxy WebSocket 🚀

🎯 Objectifs

✔️ Mettre en place un service gRPC pour envoyer et recevoir des requêtes efficacement.

✔️ Créer un reverse proxy pour faciliter la communication avec le service gRPC.

🏗️ Composants du Système

🖥️ Serveur gRPC : Gère les messages de chat et les informations utilisateur

🔄 Proxy WebSocket : Fait le lien entre les clients web et le serveur gRPC

💻 Client Web : Interface utilisateur pour interagir avec le système de chat

📌 Prérequis
🟢 Node.js (v14.x ou supérieur)
📦 npm (v6.x ou supérieur)
⚙️ Installation

1️⃣ Créer et accéder au répertoire du projet
```bash
mkdir TP5-SOA_grpc-ws-reverse-proxy
cd TP5-SOA_grpc-ws-reverse-proxy
npm init -y
```
2️⃣ Installer les dépendances
```bash
npm install @grpc/grpc-js @grpc/proto-loader ws
```

📂 Structure du Projet

TP5_SOA_grpc-ws-reverse-proxy/
├── 📜 chat.proto         # Définition du service avec Protocol Buffers
├── 🖥️ server.js          # Implémentation du serveur gRPC
├── 🔄 proxy.js           # Reverse proxy WebSocket
├── 🌐 client.html        # Interface web
└── 📖 README.md          # Ce fichier

📄 Création Fichiers du Projet

📜 1. Définition du Service (chat.proto)

🖥️ 2. Serveur gRPC (server.js)

🔄 3. Reverse Proxy WebSocket (proxy.js)

🌐 4. Client Web (client.html)

🚀 Démarrage du Projet

▶️ 1. Lancer le serveur gRPC
```bash
node server.js
```
✅ Sortie attendue : 🚀 Serveur gRPC en écoute sur 0.0.0.0:50051

▶️ 2. Lancer le reverse proxy WebSocket
```bash
node proxy.js
```
✅ Sortie attendue : 🔄 Reverse proxy WebSocket en écoute sur ws://localhost:8080

🌐 3. Ouvrir le client web

🛠️ Tests avec Postman

1️⃣ Ouvrez Postman et créez une nouvelle requête WebSocket 

2️⃣ Connectez-vous à l'URL ws://localhost:8080 

3️⃣ Envoyez un message JSON au format suivant :

```json
{
  "chat_message": {
    "id": "msg1",
    "room_id": "room1",
    "sender_id": "client1",
    "content": "Hello World !"
  }
}
```
4️⃣ Vous devriez recevoir une réponse du serveur avec un horodatage ⏳

✅ Fonctionnalités Implémentées
🔹 Fonctionnalités de Base
👤 Récupération des informations utilisateur via gRPC
🔄 Streaming bidirectionnel des messages de chat
🌐 Relais des messages WebSocket vers gRPC
🔹 Fonctionnalités Étendues
📜 Stockage et récupération de l'historique des messages
🌍 Client web simple pour les messages en temps réel

📜 Auteur

👤 Samah Saidi

4Info - Classe DS1

📧 Contact: samah.saidi@polytechnicien.tn

🔗 GitHub: https://github.com/samah-saidi
