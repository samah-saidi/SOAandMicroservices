// schema.js
const gql = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
  }

  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    stock: Int!
    category: String!
    images: [String!]
  }

  type DecorationArticle {
    id: ID!
    name: String!
    description: String!
    price: Float!
    stock: Int!
    category: String!
    style: String!
    material: String!
    images: [String!]
    dimensions: String!
    color: String!
    brand: String!
    condition: String!
    location: String!
  }

  type AuthResponse {
    success: Boolean!
    token: String
    user: User
    message: String
  }

  type RegisterResponse {
    success: Boolean!
    message: String!
    user: User
  }

  type ProductResponse {
    success: Boolean!
    message: String!
    product: Product
  }

  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  input ProductInput {
    name: String!
    description: String!
    price: Float!
    stock: Int!
    category: String!
    images: [String!]
  }

  input ProductUpdateInput {
    name: String
    description: String
    price: Float
    stock: Int
    category: String
    images: [String!]
  }

  type Query {
    # Authentification
    me: User

    # Produits
    products(query: String, category: String, minPrice: Float, maxPrice: Float): [Product!]!
    product(id: ID!): Product

    # Articles de décoration
    decorationArticles(
      query: String
      category: String
      style: String
      material: String
      location: String
      minPrice: Float
      maxPrice: Float
    ): [DecorationArticle!]!
    decorationArticle(id: ID!): DecorationArticle
  }

  type Mutation {
    # Authentification
    login(username: String!, password: String!): AuthResponse!
    register(username: String!, email: String!, password: String!, role: String!): AuthResponse!

    # Produits
    createProduct(
      name: String!
      description: String!
      price: Float!
      stock: Int!
      category: String!
      images: [String!]
    ): Product!
    updateProduct(
      id: ID!
      name: String
      description: String
      price: Float
      stock: Int
      category: String
      images: [String!]
    ): Product!
    deleteProduct(id: ID!): Boolean!

    # Articles de décoration
    createDecorationArticle(
      name: String!
      description: String!
      price: Float!
      stock: Int!
      category: String!
      style: String!
      material: String!
      images: [String!]
      dimensions: String!
      color: String!
      brand: String!
      condition: String!
      location: String!
    ): DecorationArticle!
    updateDecorationArticle(
      id: ID!
      name: String
      description: String
      price: Float
      stock: Int
      category: String
      style: String
      material: String
      images: [String!]
      dimensions: String
      color: String
      brand: String
      condition: String
      location: String
    ): DecorationArticle!
    deleteDecorationArticle(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;