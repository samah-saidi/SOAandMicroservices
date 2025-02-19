API RESTful avec Rate Limiting et CORS

📌 Objectifs

Ce projet consiste à mettre en place une API RESTful avec Express.js, en intégrant :

Gestion des CORS : Autorisation des requêtes multi-origines.

Rate Limiting : Limitation du nombre de requêtes pour améliorer la sécurité.

🛠 Outils et Technologies

Node.js

Express.js

CORS (cors)

Rate Limiting (express-rate-limit)

SQLite3 (pour la gestion des données)

1. 📥 Installation des Dépendances
   Installez les modules nécessaires pour le projet :

```bash
    npm install express sqlite3 cors express-rate-limit
```

2. 🧪 Tester l'API
   Tester CORS Créez un fichier HTML pour effectuer une requête vers l'API :

```HTML
    <!DOCTYPE html>
    <html>
    <body>
        <h1>Test CORS</h1>
        <script>
            fetch('http://localhost:3000/personnes')
                .then(response => response.json())
                .then(data => console.log(data))
                .catch(error => console.error(error));
        </script>
    </body>
    </html>
```

Ouvrez ce fichier dans un navigateur et vérifiez que les données sont bien récupérées. ✅

![ ](images/indaxhtml.png)

Tester Rate Limiting 1- Utilisez Postman pour envoyer plus de 100 requêtes en moins de 15 minutes. 🚀

2- Après avoir atteint la limite, vous recevrez le message suivant :

```JSON
    {
    "message": "Trop de requêtes effectuées depuis cette IP, veuillez réessayer après 15 minutes."
    }
```
