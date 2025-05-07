# Utilisation de l'image Node.js 22 Alpine pour une image légère
FROM node:22-alpine

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances de production uniquement
RUN npm install --production

# Copie du code source
COPY index.js ./

# Exposition du port utilisé par le service
EXPOSE 3002

# Commande de démarrage du service
CMD ["node", "index.js"]