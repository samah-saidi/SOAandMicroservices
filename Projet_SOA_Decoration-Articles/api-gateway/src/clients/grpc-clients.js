const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { promisify } = require('util');

// Chemins des fichiers proto
const ARTICLE_PROTO_PATH = path.join(__dirname, '../../../proto/article.proto');
const CATEGORY_PROTO_PATH = path.join(__dirname, '../../../proto/category.proto');

// Configuration pour le chargement des fichiers proto
const protoOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};

// Chargement des définitions proto
const articlePackageDefinition = protoLoader.loadSync(ARTICLE_PROTO_PATH, protoOptions);
const categoryPackageDefinition = protoLoader.loadSync(CATEGORY_PROTO_PATH, protoOptions);

const articleProto = grpc.loadPackageDefinition(articlePackageDefinition).article;
const categoryProto = grpc.loadPackageDefinition(categoryPackageDefinition).category;

// Adresses des services gRPC
const ARTICLE_SERVICE_URL = process.env.ARTICLE_SERVICE_URL || 'article-service:50051';
const CATEGORY_SERVICE_URL = process.env.CATEGORY_SERVICE_URL || 'category-service:50052';

// Création des clients gRPC
const articleGrpcClient = new articleProto.ArticleService(
  ARTICLE_SERVICE_URL,
  grpc.credentials.createInsecure()
);

const categoryGrpcClient = new categoryProto.CategoryService(
  CATEGORY_SERVICE_URL,
  grpc.credentials.createInsecure()
);

// Promisification des méthodes des clients gRPC
const articleClient = {
  getArticle: promisify(articleGrpcClient.getArticle.bind(articleGrpcClient)),
  listArticles: promisify(articleGrpcClient.listArticles.bind(articleGrpcClient)),
  createArticle: promisify(articleGrpcClient.createArticle.bind(articleGrpcClient)),
  updateArticle: promisify(articleGrpcClient.updateArticle.bind(articleGrpcClient)),
  deleteArticle: promisify(articleGrpcClient.deleteArticle.bind(articleGrpcClient)),
  searchArticles: promisify(articleGrpcClient.searchArticles.bind(articleGrpcClient))
};

const categoryClient = {
  getCategory: promisify(categoryGrpcClient.getCategory.bind(categoryGrpcClient)),
  listCategories: promisify(categoryGrpcClient.listCategories.bind(categoryGrpcClient)),
  createCategory: promisify(categoryGrpcClient.createCategory.bind(categoryGrpcClient)),
  updateCategory: promisify(categoryGrpcClient.updateCategory.bind(categoryGrpcClient)),
  deleteCategory: promisify(categoryGrpcClient.deleteCategory.bind(categoryGrpcClient))
};

module.exports = {
  articleClient,
  categoryClient
};