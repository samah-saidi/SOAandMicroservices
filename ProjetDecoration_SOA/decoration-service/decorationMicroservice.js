const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const connectDB = require('./config/database');
const DecorationArticle = require('./models/DecorationArticle');
const openRouterService = require('./services/openRouterService');

// Charger le fichier proto
const PROTO_PATH = path.join(__dirname, 'decoration.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const decorationService = protoDescriptor.decoration;

// Connexion à MongoDB
connectDB();

// Implémentation des méthodes du service
const getDecorationArticle = async (call, callback) => {
    try {
        const article = await DecorationArticle.findById(call.request.article_id);
        if (article) {
            callback(null, {
                article: {
                    id: article._id.toString(),
                    name: article.name,
                    description: article.description,
                    price: article.price,
                    stock: article.stock,
                    category: article.category,
                    style: article.style,
                    material: article.material,
                    images: article.images,
                    dimensions: article.dimensions,
                    color: article.color,
                    brand: article.brand,
                    condition: article.condition,
                    location: article.location
                }
            });
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: 'Article non trouvé'
            });
        }
    } catch (error) {
        console.error('Error in getDecorationArticle:', error);
        callback({
            code: grpc.status.INTERNAL,
            details: 'Erreur lors de la récupération de l\'article'
        });
    }
};

const searchDecorationArticles = async (call, callback) => {
    try {
        const { query, category, style, material, location, min_price, max_price } = call.request;
        const filter = {};

        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { brand: { $regex: query, $options: 'i' } }
            ];
        }

        if (category) filter.category = { $regex: category, $options: 'i' };
        if (style) filter.style = { $regex: style, $options: 'i' };
        if (material) filter.material = { $regex: material, $options: 'i' };
        if (location) filter.location = { $regex: location, $options: 'i' };

        if (min_price !== undefined || max_price !== undefined) {
            filter.price = {};
            if (min_price !== undefined) filter.price.$gte = min_price;
            if (max_price !== undefined) filter.price.$lte = max_price;
        }

        const articles = await DecorationArticle.find(filter);
        callback(null, {
            articles: articles.map(article => ({
                id: article._id.toString(),
                name: article.name,
                description: article.description,
                price: article.price,
                stock: article.stock,
                category: article.category,
                style: article.style,
                material: article.material,
                images: article.images,
                dimensions: article.dimensions,
                color: article.color,
                brand: article.brand,
                condition: article.condition,
                location: article.location
            }))
        });
    } catch (error) {
        console.error('Error in searchDecorationArticles:', error);
        callback({
            code: grpc.status.INTERNAL,
            details: 'Erreur lors de la recherche des articles'
        });
    }
};

const createDecorationArticle = async (call, callback) => {
    try {
        const {
            name,
            description,
            price,
            stock,
            category,
            style,
            material,
            images,
            dimensions,
            color,
            brand,
            condition,
            location
        } = call.request;

        if (!name || !description || !price || !stock || !category || !style || !material) {
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                details: 'Tous les champs obligatoires doivent être remplis'
            });
            return;
        }

        // Analyse du sentiment et extraction des mots-clés
        const sentimentAnalysis = await openRouterService.analyzeSentiment(description);

        const newArticle = new DecorationArticle({
            name,
            description,
            price,
            stock,
            category,
            style,
            material,
            images: images || [],
            dimensions,
            color,
            brand,
            condition,
            location,
            sentimentAnalysis: {
                score: sentimentAnalysis.score,
                keywords: sentimentAnalysis.keywords,
                lastUpdated: new Date()
            }
        });

        await newArticle.save();
        callback(null, {
            success: true,
            message: 'Article créé avec succès',
            article: {
                id: newArticle._id.toString(),
                name: newArticle.name,
                description: newArticle.description,
                price: newArticle.price,
                stock: newArticle.stock,
                category: newArticle.category,
                style: newArticle.style,
                material: newArticle.material,
                images: newArticle.images,
                dimensions: newArticle.dimensions,
                color: newArticle.color,
                brand: newArticle.brand,
                condition: newArticle.condition,
                location: newArticle.location
            }
        });
    } catch (error) {
        console.error('Error in createDecorationArticle:', error);
        callback({
            code: grpc.status.INTERNAL,
            details: 'Erreur lors de la création de l\'article'
        });
    }
};

const updateDecorationArticle = async (call, callback) => {
    try {
        const { article_id, ...updateData } = call.request;
        const article = await DecorationArticle.findById(article_id);

        if (!article) {
            callback({
                code: grpc.status.NOT_FOUND,
                details: 'Article non trouvé'
            });
            return;
        }

        // Si la description est mise à jour, réanalyser le sentiment
        if (updateData.description) {
            const sentimentAnalysis = await openRouterService.analyzeSentiment(updateData.description);
            updateData.sentimentAnalysis = {
                score: sentimentAnalysis.score,
                keywords: sentimentAnalysis.keywords,
                lastUpdated: new Date()
            };
        }

        const updatedArticle = await DecorationArticle.findByIdAndUpdate(
            article_id,
            updateData,
            { new: true }
        );

        callback(null, {
            success: true,
            message: 'Article mis à jour avec succès',
            article: updatedArticle
        });
    } catch (error) {
        callback({
            code: grpc.status.INTERNAL,
            details: 'Erreur lors de la mise à jour de l\'article'
        });
    }
};

const deleteDecorationArticle = async (call, callback) => {
    try {
        const { article_id } = call.request;
        const result = await DecorationArticle.findByIdAndDelete(article_id);

        if (!result) {
            callback({
                code: grpc.status.NOT_FOUND,
                details: 'Article non trouvé'
            });
            return;
        }

        callback(null, {
            success: true,
            message: 'Article supprimé avec succès'
        });
    } catch (error) {
        callback({
            code: grpc.status.INTERNAL,
            details: 'Erreur lors de la suppression de l\'article'
        });
    }
};

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(decorationService.DecorationService.service, {
    getDecorationArticle,
    searchDecorationArticles,
    createDecorationArticle,
    updateDecorationArticle,
    deleteDecorationArticle
});

const PORT = process.env.PORT || 50053;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
        console.error('Erreur lors du démarrage du serveur:', error);
        return;
    }
    console.log(`Serveur gRPC démarré sur le port ${port}`);
}); 