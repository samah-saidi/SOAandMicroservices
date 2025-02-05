# TP1 Introduction aux APIs RESTful

Un guide complet pour travailler avec diverses APIs REST en utilisant Node.js

## 📋 Table des matières

    Aperçu
    APIs disponibles
    Prérequis
    Installation
        Étape 1 : Créer un dossier pour le projet
        Étape 2 : Installer les dépendances
    Structure du projet
    Explication du code
        1. Utilisation de request pour OpenWeatherMap
        2. Utilisation de fetch pour OpenWeatherMap
        3. Utilisation de axios pour OpenWeatherMap
        4. Utilisation de axios pour Open Library API
        5. Utilisation de axios pour NASA API
        6. Utilisation de axios pour RandomUser API
    Gestion des erreurs communes
    Tests et validation
    Ressources

## Aperçu

Cet atelier offre une expérience pratique avec les APIs REST en utilisant Node.js. Vous apprendrez à interagir avec différentes APIs populaires en utilisant diverses bibliothèques de client HTTP :

🌤️ index - Données météorologiques
📚 Open_Library - Informations sur les livres
🚀 Nasa - Images et données astronomiques
👥 RandomUser - Génération de profils utilisateurs aléatoires

## Prérequis

Avant de commencer, assurez-vous d'avoir :

Node.js (version LTS recommandée)
npm (inclus avec Node.js)
Éditeur de texte ou IDE (VS Code recommandé)
Clés API :
Clé API OpenWeatherMap -
Clé API NASA (optionnelle) -

Pour commencer

## 🚀Installation

### 1 : Créer un dossier pour le projet

1- Ouvrez un terminal et créez un dossier pour votre projet :

```bash
mkdir TP1_SOA
cd TP1_SOA
```

2- Initialisez le projet Node.js :

```bash
npm init -y
```

    Cela crée un fichier `package.json` dans votre dossier.

3- Installez les dépendances requises :

```bash
npm install request node-fetch axios
```

### 2 : Installer les dépendances

Installez les bibliothèques nécessaires pour interagir avec les APIs :

\*\*\*`request` (pour faire des requêtes HTTP) :

```bash
npm install request
```

\*\*\*`node-fetch` (pour utiliser fetch dans Node.js) :

```bash
npm install node-fetch
```

\*\*\*`axios` (une alternative moderne à request) :

```bash
npm install axios
```

# 📂 Structure du projet

📦 TP1_SOA
┣ 📜 node_modules
┣ 📜 index.js
┣ 📜 Open_Library.js
┣ 📜 Nasa.js
┣ 📜 RandomUser.js
┣ 📜 .gitignore
┣ 📜 package.json
┗ 📜 README.md

# 🧩 Explication du code

#### 1. Utilisation de `request` pour OpenWeatherMap 🌦️

Code : index.js

```javascript
const request = require("request");
const API_KEY = "38f9264b8e345e5059d64b5e08c19663";
const BASE_URL =
  "http://api.openweathermap.org/data/2.5/weather?appid=" +
  API_KEY +
  "&units=metric&lang=fr&q=";

function getWeatherData(city, callback) {
  const url = BASE_URL + city;
  request(url, function (error, response, body) {
    if (error) {
      callback(error, null);
    } else {
      const weatherData = JSON.parse(body);
      callback(null, weatherData);
    }
  });
}

getWeatherData("Sousse", function (error, data) {
  if (error) {
    console.error("Erreur :", error);
  } else {
    console.log(`Description : ${data.weather[0].description}`);
    console.log(`Température : ${data.main.temp}°C`);
    console.log(`Humidité : ${data.main.humidity}%`);
  }
});
```

Sortie attendue :

```bash
PS D:\SOA\TP1_SOA> node index.js
Description : scattered clouds
Température : 289.03
Humidité : 63
PS D:\SOA\TP1_SOA> node index.js
Description : partiellement nuageux
Température : 15.88
Humidité : 63
```

#### 2. Utilisation de `fetch` pour OpenWeatherMap 🌦️

```javascript
const fetch = require("node-fetch");

async function getWeatherData(city) {
  const url = `http://api.openweathermap.org/data/2.5/weather?appid=VOTRE_CLE_API&units=metric&lang=fr&q=${city}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

getWeatherData("Sousse")
  .then((data) => {
    console.log("Description :", data.weather[0].description);
    console.log("Température :", data.main.temp);
    console.log("Humidité :", data.main.humidity);
  })
  .catch((error) => {
    console.error("Erreur :", error);
  });
```

Sortie attendue :

```bash
PS D:\SOA\TP1_SOA> node index.js
Description : partiellement nuageux
Température : 15.88
Humidité : 63
```

#### 3. Utilisation de `axios` pour Open Library API 📚

Code : index.js

```javascript
const axios = require("axios");

const API_KEY = "38f9264b8e345e5059d64b5e08c19663";
const BASE_URL =
  "http://api.openweathermap.org/data/2.5/weather?appid=" +
  API_KEY +
  "&units=metric&lang=fr&q=";

async function getWeatherData(city) {
  const url = BASE_URL + city;
  const response = await axios.get(url);
  return response.data;
}
getWeatherData("Sousse")
  .then((data) => {
    console.log("Description :", data.weather[0].description);
    console.log("Température :", data.main.temp);
    console.log("Humidité :", data.main.humidity);
  })
  .catch((error) => {
    console.error("Erreur :", error);
  });
```

Sortie attendue :

```bash
PS D:\SOA\TP1_SOA> node index.js
Description : partiellement nuageux
Température : 15.88
Humidité : 63
```

#### 4. Utilisation de `axios` pour Open Library API 📚

```javascript
//Open Library API
const axios = require("axios");

async function getBookData() {
  const url =
    "https://openlibrary.org/api/books?bibkeys=ISBN:0451526538&format=json&jscmd=data";

  try {
    const response = await axios.get(url);
    const bookData = response.data["ISBN:0451526538"];

    const title = bookData.title;
    const subtitle = bookData.subtitle || "Pas de sous-titre";
    const numberOfPages = bookData.number_of_pages || "Inconnu";

    console.log("Titre:", title);
    console.log("Sous-titre:", subtitle);
    console.log("Nombre de pages:", numberOfPages);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

getBookData();
```

Sortie attendue :

```bash
PS D:\SOA\TP1_SOA> node Open_Library.js
Titre: The adventures of Tom Sawyer
Sous-titre: Pas de sous-titre
Nombre de pages: 216
```

#### 5. Utilisation de `axios` pour NASA API 🚀

```javascript
//NASA API
const axios = require("axios");

async function getNasaData() {
  const url = "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY";
  try {
    const response = await axios.get(url);
    console.log("Données NASA:", response.data);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

getNasaData();
```

Sortie attendue :

```bash
PS D:\SOA\TP1_SOA> node Nasa.js
Données NASA:
{
  copyright: '\nGabriel Muñoz\n',
  date: '2025-02-05',
  explanation: "Where is Comet ATLAS going? In the featured time-lapse video, the comet is not itself moving very much, but the Earth's rotation makes it appear to be setting over a hill. The Comet C/2024 G3 (ATLAS) sequence was captured with an ordinary camera on January 22 from the Araucanía Region in central Chile. Comet ATLAS has been an impressive site in the evening skies of Earth's Southern Hemisphere over the past few weeks, so bright and awe-inspiring that it may eventually become known as the Great Comet of 2025. Unfortunately, Comet G3 ATLAS is not going anywhere anymore because its central nucleus broke up during its close pass to the Sun last month. Some of the comet's scattered remains of rocks and ice will continue to orbit the Sun, some in nearly the same outward section of the orbit that the comet's nucleus would have taken.",
  media_type: 'video',
  service_version: 'v1',
  title: 'Comet G3 ATLAS Setting over a Chilean Hill\n',
  url: 'https://www.youtube.com/embed/nt5j0NiVesQ'
}
```

#### 6. Utilisation de `axios` pour RandomUser API 👥

```javascript
//RandomUser API
const axios = require("axios");

async function getRandomUser() {
  const url = "https://randomuser.me/api/";
  try {
    const response = await axios.get(url);
    const user = response.data.results[0];
    const gender = user.gender;
    const name = `${user.name.title} ${user.name.first} ${user.name.last}`;
    const location = `${user.location.city}, ${user.location.state}, ${user.location.postcode}`;
    const email = user.email;
    const username = user.login.username;
    const password = user.login.password;
    console.log("Genre:", gender);
    console.log("Nom complet:", name);
    console.log("Localisation:", location);
    console.log("Email:", email);
    console.log("Nom d'utilisateur:", username);
    console.log("Mot de passe:", password);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

getRandomUser();
```

Sortie attendue :

```bash
PS D:\SOA\TP1_SOA> node RandomUser
Genre: male
Nom complet: Mr Aiden Kumar
Localisation: Wellington, Bay of Plenty, 80525
Email: aiden.kumar@example.com
Nom d'utilisateur: brownpeacock381
Mot de passe: hack
```

## 🛠 Gestion des erreurs communes

# API Erreur Code HTTP

OpenWeatherMap 🌦️ Clé API invalide 401
Open Library 📖 ISBN introuvable 404
NASA 🚀 Limite d'appels dépassée 429
RandomUser 👥 Paramètres de requête invalides 400

# 📝 Tests et validation

Exécutez les scripts pour vérifier le bon fonctionnement des appels API :

node index.js # Test API météo 🌦️
node Open_Library.js # Test API livres 📚
node Nasa.js # Test API NASA 🚀
node RandomUser.js # Test API utilisateurs aléatoires 👥

# Ressources

📚 Documentation OpenWeatherMap
📖 Guide API Open Library
🚀 Portail API NASA
👥 Documentation RandomUser
📘 Documentation Node.js
🔧 Documentation Axios
