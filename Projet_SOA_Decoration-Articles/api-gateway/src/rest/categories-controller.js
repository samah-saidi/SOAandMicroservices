const express = require('express');
const { categoryClient } = require('../clients/grpc-clients');
const { publishCategoryCreated, publishCategoryUpdated, publishCategoryDeleted } = require('../kafka/producer');

const router = express.Router();

// GET /api/categories - Récupérer toutes les catégories avec pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const response = await categoryClient.listCategories({ page, limit });
    res.json({
      success: true,
      data: {
        categories: response.categories,
        total: response.total,
        page,
        limit,
        totalPages: Math.ceil(response.total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur REST - GET /categories:', error);
    res.status(500).json({
      success: false,
      error: `Erreur lors de la récupération des catégories: ${error.message}`
    });
  }
});

// GET /api/categories/:id - Récupérer une catégorie par son ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await categoryClient.getCategory({ id });

    if (!response.category) {
      return res.status(404).json({
        success: false,
        error: 'Catégorie non trouvée'
      });
    }

    res.json({
      success: true,
      data: response.category
    });
  } catch (error) {
    console.error(`Erreur REST - GET /categories/${req.params.id}:`, error);
    res.status(error.code === 5 ? 404 : 500).json({
      success: false,
      error: `Erreur lors de la récupération de la catégorie: ${error.message}`
    });
  }
});

// POST /api/categories - Créer une nouvelle catégorie
router.post('/', async (req, res) => {
  try {
    const categoryData = req.body;
    
    // Validation des données
    if (!categoryData.nom) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides. Le nom de la catégorie est requis.'
      });
    }

    const response = await categoryClient.createCategory({ category: categoryData });
    
    // Publier l'événement via Kafka
    await publishCategoryCreated(response.category);
    
    res.status(201).json({
      success: true,
      data: response.category
    });
  } catch (error) {
    console.error('Erreur REST - POST /categories:', error);
    res.status(500).json({
      success: false,
      error: `Erreur lors de la création de la catégorie: ${error.message}`
    });
  }
});

// PUT /api/categories/:id - Mettre à jour une catégorie existante
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    
    // Validation des données
    if (!categoryData.nom) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides. Le nom de la catégorie est requis.'
      });
    }

    // Ajout de l'ID à l'objet catégorie
    const categoryToUpdate = { ...categoryData, id };
    
    const response = await categoryClient.updateCategory({ category: categoryToUpdate });
    
    if (!response.success) {
      return res.status(404).json({
        success: false,
        error: 'Catégorie non trouvée ou impossible à mettre à jour'
      });
    }
    
    // Publier l'événement via Kafka
    await publishCategoryUpdated(response.category);
    
    res.json({
      success: true,
      data: response.category
    });
  } catch (error) {
    console.error(`Erreur REST - PUT /categories/${req.params.id}:`, error);
    res.status(error.code === 5 ? 404 : 500).json({
      success: false,
      error: `Erreur lors de la mise à jour de la catégorie: ${error.message}`
    });
  }
});

// DELETE /api/categories/:id - Supprimer une catégorie
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await categoryClient.deleteCategory({ id });
    
    if (!response.success) {
      return res.status(404).json({
        success: false,
        error: 'Catégorie non trouvée ou impossible à supprimer'
      });
    }
    
    // Publier l'événement via Kafka
    await publishCategoryDeleted(id);
    
    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });
  } catch (error) {
    console.error(`Erreur REST - DELETE /categories/${req.params.id}:`, error);
    res.status(error.code === 5 ? 404 : 500).json({
      success: false,
      error: `Erreur lors de la suppression de la catégorie: ${error.message}`
    });
  }
});

module.exports = router;