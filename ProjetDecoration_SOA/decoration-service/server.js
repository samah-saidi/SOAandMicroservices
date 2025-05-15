const express = require('express');
const { Kafka, Partitioners } = require('kafkajs');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const port = 3000;

// Configuration Kafka
const kafka = new Kafka({
    clientId: 'decoration-service-web',
    brokers: ['localhost:9092']
});

const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner
});
const consumer = kafka.consumer({ groupId: 'web-test-group' });

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.static('public'));

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ port: 3001 });

// Gérer les connexions WebSocket
wss.on('connection', (ws) => {
    console.log('Nouvelle connexion WebSocket établie');

    // Gérer les erreurs de connexion WebSocket
    ws.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
    });

    // Gérer la fermeture de la connexion
    ws.on('close', () => {
        console.log('Connexion WebSocket fermée');
    });
});

// Validation des messages
function validateMessage(message) {
    if (!message.topic || !['gateway_events', 'product_events', 'decoration_events'].includes(message.topic)) {
        throw new Error('Topic invalide');
    }
    if (!message.type) {
        throw new Error('Type de message requis');
    }
    if (!message.content) {
        throw new Error('Contenu du message requis');
    }
    return true;
}

// Route pour envoyer un message
app.post('/send-message', async (req, res) => {
    try {
        const message = req.body;

        // Valider le message
        validateMessage(message);

        // Ajouter un timestamp si non présent
        if (!message.timestamp) {
            message.timestamp = new Date().toISOString();
        }

        // Envoyer le message à Kafka
        await producer.send({
            topic: message.topic,
            messages: [
                {
                    value: JSON.stringify({
                        type: message.type,
                        content: message.content,
                        timestamp: message.timestamp
                    })
                }
            ]
        });

        // Diffuser le message à tous les clients WebSocket connectés
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });

        res.json({
            success: true,
            message: 'Message envoyé avec succès',
            data: message
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Fonction pour démarrer le consommateur Kafka
async function startConsumer() {
    try {
        await consumer.connect();
        await consumer.subscribe({
            topics: ['gateway_events', 'product_events', 'decoration_events'],
            fromBeginning: true
        });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const messageValue = JSON.parse(message.value.toString());

                    // Diffuser le message à tous les clients WebSocket connectés
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                topic,
                                type: messageValue.type,
                                content: messageValue.content,
                                timestamp: messageValue.timestamp
                            }));
                        }
                    });
                } catch (error) {
                    console.error('Erreur lors du traitement du message:', error);
                }
            },
        });
    } catch (error) {
        console.error('Erreur du consommateur Kafka:', error);
        // Tenter de reconnecter après un délai
        setTimeout(startConsumer, 5000);
    }
}

// Démarrer le serveur
async function startServer() {
    try {
        await producer.connect();
        await startConsumer();

        app.listen(port, () => {
            console.log(`Serveur web démarré sur http://localhost:${port}`);
            console.log(`WebSocket serveur démarré sur ws://localhost:3001`);
        });
    } catch (error) {
        console.error('Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}

// Gérer l'arrêt propre
process.on('SIGINT', async () => {
    try {
        await consumer.disconnect();
        await producer.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        process.exit(1);
    }
});

startServer(); 