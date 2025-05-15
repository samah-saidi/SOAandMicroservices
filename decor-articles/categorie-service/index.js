const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const sendMessage = require('../kafka/producer');


const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const categories = [];

// Récupérer toutes les catégories
app.get("/categories", (req, res) => {
  res.json(categories);
});

// Créer une catégorie
app.post("/categories", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Le nom est obligatoire." });
  }
  const newCat = { id: uuidv4(), name };
  categories.push(newCat);

   // Envoi Kafka
  sendMessage('categories_topic', newCat);
  res.status(201).json(newCat);
});

// Supprimer une catégorie
app.delete("/categories/:id", (req, res) => {
  const { id } = req.params;
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Catégorie introuvable." });
  }
  categories.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => console.log(`CategorieService running on port ${PORT}`));
