const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const axios = require('axios');

const packageDefinition = protoLoader.loadSync('article.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const articleProto = grpc.loadPackageDefinition(packageDefinition).article;

const articleClient = new articleProto.ArticleService('article-service:50051', grpc.credentials.createInsecure());

const resolvers = {
  Query: {
    articles: () =>
      new Promise((resolve, reject) => {
        articleClient.ListArticles({}, (err, response) => {
          if (err) reject(err);
          else resolve(response.articles);
        });
      }),

    categories: async () => {
      const res = await axios.get('http://categorie-service:3001/categories');
      return res.data;
    },
  },

  Mutation: {
    createArticle: (_, { nomArt, description, categorie }) =>
      new Promise((resolve, reject) => {
        articleClient.CreateArticle({ nomArt, description, categorie }, (err, response) => {
          if (err) reject(err);
          else resolve(response.article);
        });
      }),

    createCategorie: async (_, { name }) => {
      const res = await axios.post('http://categorie-service:3001/categories', { name });
      return res.data;
    },
  },
};

module.exports = resolvers;
