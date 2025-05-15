const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { v4: uuidv4 } = require('uuid');
const sendMessage = require('../kafka/producer');



const packageDefinition = protoLoader.loadSync('article.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const articleProto = grpc.loadPackageDefinition(packageDefinition).article;

const articles = [];

const server = new grpc.Server();

server.addService(articleProto.ArticleService.service, {
  GetArticle: (call, callback) => {
    const article = articles.find(a => a.id === call.request.article_id);
    if (article) {
      callback(null, { article });
    } else {
      callback({ code: grpc.status.NOT_FOUND, message: 'Article not found' });
    }
  },
  ListArticles: (call, callback) => {
    callback(null, { articles });
  },
    CreateArticle: (call, callback) => {
    const { nomArt, description, categorie } = call.request;
    const newArticle = { id: uuidv4(), nomArt, description, categorie };
    articles.push(newArticle);

    // Envoi Kafka
    sendMessage('articles_topic', newArticle);

    callback(null, { article: newArticle });
    },
});

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('ArticleService running on port 50051');
  server.start();
});


