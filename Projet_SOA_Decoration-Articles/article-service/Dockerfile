FROM node:16-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Exposer les ports
EXPOSE 3001 50051

# Commande de démarrage
CMD ["node", "src/index.js"]