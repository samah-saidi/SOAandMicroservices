const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const Category = require('../models/Category');

// Chargement du fichier proto
const PROTO_PATH = path.join(__dirname, '../../../proto/category.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const categoryProto = grpc.loadPackageDefinition(packageDefinition).category;

// Implémentation des méthodes du service gRPC
const categoryServiceImplementation = {
  // Récupérer une catégorie par ID
  getCategory: async (call, callback) => {
    try {
      const category = await Category.findById(call.request.id);
      if (!category) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Catégorie non trouvée'
        });
      }
      callback(null, { category });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  },

  // Lister les catégories avec pagination
  listCategories: async (call, callback) => {
    try {
      const { page = 1, limit = 10 } = call.request;
      
      const categories = await Category.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ date_creation: -1 });
      
      const total = await Category.countDocuments();
      
      callback(null, { categories, total });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  },

  // Créer une nouvelle catégorie
  createCategory: async (call, callback) => {
    try {
      const categoryData = call.request.category;
      const newCategory = new Category({
        nom: categoryData.nom,
        description: categoryData.description,
        image_url: categoryData.image_url
      });

      const savedCategory = await newCategory.save();
      callback(null, { category: savedCategory, success: true });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  },

  // Mettre à jour une catégorie existante
  updateCategory: async (call, callback) => {
    try {
      const categoryData = call.request.category;
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryData.id,
        {
          nom: categoryData.nom,
          description: categoryData.description,
          image_url: categoryData.image_url,
          date_modification: Date.now()
        },
        { new: true }
      );

      if (!updatedCategory) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Catégorie non trouvée'
        });
      }

      callback(null, { category: updatedCategory, success: true });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  },

  // Supprimer une catégorie
  deleteCategory: async (call, callback) => {
    try {
      const result = await Category.findByIdAndDelete(call.request.id);
      if (!result) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Catégorie non trouvée'
        });
      }
      callback(null, { success: true });
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
    categoryProto.CategoryService.service,
    categoryServiceImplementation
  );
  return server;
}

module.exports = {
  startGrpcServer
};