const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Article {
    id: String!
    nomArt: String!
    description: String!
    categorie: String!
  }

  type Categorie {
    id: String!
    name: String!
  }

  type Query {
    articles: [Article]
    categories: [Categorie]
  }

  type Mutation {
    createArticle(nomArt: String!, description: String!, categorie: String!): Article
    createCategorie(name: String!): Categorie
  }
`;

module.exports = typeDefs;
