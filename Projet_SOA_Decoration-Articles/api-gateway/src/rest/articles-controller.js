const express = require('express');
const { articleClient } = require('../clients/grpc-clients');
const { publishArticleCreated, publishArticleUpdated, publishArticleDeleted } = require('../kafka/producer');

const router = express.Router();

// GET /api/articles - Récupérer tous les articles avec pagination et filtrage optionnel
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const categorie_id = req.query.categorie_id;

    const response = await articleClient.listArticles({ page, limit, categorie_id });
    res.json({
      success: true,
      data: {
        articles: response.articles,
        total: response.total,
        page,
        limit,
        totalPages: Math.ceil(response.total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur REST - GET /articles:', error);
    res.status(500).json({
      success: false,
      error: `Erreur lors de la récupération des articles: ${error.message}`
    });
  }
});

// GET /api/articles/:id - Récupérer un article par son ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await articleClient.getArticle({ id });

    if (!response.article) {
      return res.status(404).json({
        success: false,
        error: 'Article non trouvé'
      });
    }

    res.json({
      success: true,
      data: response.article
    });
  } catch (error) {
    console.error(`Erreur REST - GET /articles/${req.params.id}:`, error);
    res.status(error.code === 5 ? 404 : 500).json({
      success: false,
      error: `Erreur lors de la récupération de l'article: ${error.message}`
    });
  }
});

// POST /api/articles - Créer un nouvel article
router.post('/', async (req, res) => {
  try {
    const articleData = req.body;
    
    // Validation des données
    if (!articleData.nom_art || !articleData.description || articleData.prix === undefined || !articleData.categorie_id) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides. Assurez-vous de fournir nom_art, description, prix et categorie_id.'
      });
    }

    const response = await articleClient.createArticle({ article: articleData });
    
    // Publier l'événement via Kafka
    await publishArticleCreated(response.article);
    
    res.status(201).json({
      success: true,
      data: response.article
    });
  } catch (error) {
    console.error('Erreur REST - POST /articles:', error);
    res.status(500).json({
      success: false,
      error: `Erreur lors de la création de l'article: ${error.message}`
    });
  }
});

// PUT /api/articles/:id - Mettre à jour un article existant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const articleData = req.body;
    
    // Validation des données
    if (!articleData.nom_art || !articleData.description || articleData.prix === undefined || !articleData.categorie_id) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides. Assurez-vous de fournir nom_art, description, prix et categorie_id.'
      });
    }

    // Ajout de l'ID à l'objet article
    const articleToUpdate = { ...articleData, id };
    
    const response = await articleClient.updateArticle({ article: articleToUpdate });
    
    if (!response.success) {
      return res.status(404).json({
        success: false,
        error: 'Article non trouvé ou impossible à mettre à jour'
      });
    }
    
    // Publier l'événement via Kafka
    await publishArticleUpdated(response.article);
    
    res.json({
      success: true,
      data: response.article
    });
  } catch (error) {
    console.error(`Erreur REST - PUT /articles/${req.params.id}:`, error);
    res.status(error.code === 5 ? 404 : 500).json({
      success: false,
      error: `Erreur lors de la mise à jour de l'article: ${error.message}`
    });
  }
});

// DELETE /api/articles/:id - Supprimer un article
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await articleClient.deleteArticle({ id });
    
    if (!response.success) {
      return res.status(404).json({
        success: false,
        error: 'Article non trouvé ou impossible à supprimer'
      });
    }
    
    // Publier l'événement via Kafka
    await publishArticleDeleted(id);
    
    res.json({
      success: true,
      message: 'Article supprimé avec succès'
    });
  } catch (error) {
    console.error(`Erreur REST - DELETE /articles/${req.params.id}:`, error);
    res.status(error.code === 5 ? 404 : 500).json({
      success: false,
      error: `Erreur lors de la suppression de l'article: ${error.message}`
    });
  }
});

// GET /api/articles/search/:query - Rechercher des articles
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const response = await articleClient.searchArticles({ query, page, limit });
    
    res.json({
      success: true,
      data: {
        articles: response.articles,
        total: response.total,
        page,
        limit,
        totalPages: Math.ceil(response.total / limit)
      }
    });
  } catch (error) {
    console.error(`Erreur REST - GET /articles/search/${req.params.query}:`, error);
    res.status(500).json({
      success: false,
      error: `Erreur lors de la recherche d'articles: ${error.message}`
    });
  }
});

module.exports = router;