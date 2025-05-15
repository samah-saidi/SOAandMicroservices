const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const Article = require('../models/Article');

// Chargement du fichier proto
const PROTO_PATH = path.join(__dirname, '../../../proto/article.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const articleProto = grpc.loadPackageDefinition(packageDefinition).article;

// Implémentation des méthodes du service gRPC
const articleServiceImplementation = {
  // Récupérer un article par ID
  getArticle: async (call, callback) => {
    try {
      const article = await Article.findById(call.request.id);
      if (!article) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Article non trouvé'
        });
      }
      callback(null, { article });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  },

  // Lister les articles avec pagination et filtre optionnel par catégorie
  listArticles: async (call, callback) => {
    try {
      const { page = 1, limit = 10, categorie_id } = call.request;
      const query = categorie_id ? { categorie_id } : {};
      
      const articles = await Article.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ date_creation: -1 });
      
      const total = await Article.countDocuments(query);
      
      callback(null, { articles, total });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  },

  // Créer un nouvel article
  createArticle: async (call, callback) => {
    try {
      const articleData = call.request.article;
      const newArticle = new Article({
        nom_art: articleData.nom_art,
        description: articleData.description,
        prix: articleData.prix,
        stock: articleData.stock,
        categorie_id: articleData.categorie_id,
        image_url: articleData.image_url,
        tags: articleData.tags
      });

      const savedArticle = await newArticle.save();
      callback(null, { article: savedArticle, success: true });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  },

  // Mettre à jour un article existant
  updateArticle: async (call, callback) => {
    try {
      const articleData = call.request.article;
      const updatedArticle = await Article.findByIdAndUpdate(
        articleData.id,
        {
          nom_art: articleData.nom_art,
          description: articleData.description,
          prix: articleData.prix,
          stock: articleData.stock,
          categorie_id: articleData.categorie_id,
          image_url: articleData.image_url,
          tags: articleData.tags,
          date_modification: Date.now()
        },
        { new: true }
      );

      if (!updatedArticle) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Article non trouvé'
        });
      }

      callback(null, { article: updatedArticle, success: true });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  },

  // Supprimer un article
  deleteArticle: async (call, callback) => {
    try {
      const result = await Article.findByIdAndDelete(call.request.id);
      if (!result) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Article non trouvé'
        });
      }
      callback(null, { success: true });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  },

  // Rechercher des articles
  searchArticles: async (call, callback) => {
    try {
      const { query, page = 1, limit = 10 } = call.request;
      
      const searchQuery = {
        $or: [
          { nom_art: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      };
      
      const articles = await Article.find(searchQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ date_creation: -1 });
      
      const total = await Article.countDocuments(searchQuery);
      
      callback(null, { articles, total });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }
};

// Configuration et démarrage du serveur gRPC
function startGrpcServer() {
  const server = new grpc.Server();
  server.addService(
    articleProto.ArticleService.service,
    articleServiceImplementation
  );
  return server;
}

module.exports = {
  startGrpcServer
};