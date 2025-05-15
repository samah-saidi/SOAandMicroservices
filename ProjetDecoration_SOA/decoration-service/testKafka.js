const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'decoration-service-test',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'test-group' });

async function runTest() {
    try {
        // Connexion du producteur et du consommateur
        await producer.connect();
        await consumer.connect();

        // S'abonner aux topics
        await consumer.subscribe({ topics: ['gateway_events', 'product_events', 'decoration_events'], fromBeginning: true });

        // Écouter les messages
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log(`\nMessage reçu sur le topic ${topic}:`);
                console.log('Partition:', partition);
                console.log('Message:', message.value.toString());
            },
        });

        // Publier des messages de test
        console.log('\nPublier des messages de test...');

        // Test pour gateway_events
        await producer.send({
            topic: 'gateway_events',
            messages: [
                {
                    value: JSON.stringify({
                        type: 'TEST_EVENT',
                        message: 'Test message for gateway events',
                        timestamp: new Date().toISOString()
                    })
                }
            ]
        });

        // Test pour product_events
        await producer.send({
            topic: 'product_events',
            messages: [
                {
                    value: JSON.stringify({
                        type: 'PRODUCT_TEST',
                        productId: '123',
                        action: 'test',
                        timestamp: new Date().toISOString()
                    })
                }
            ]
        });

        // Test pour decoration_events
        await producer.send({
            topic: 'decoration_events',
            messages: [
                {
                    value: JSON.stringify({
                        type: 'DECORATION_TEST',
                        articleId: '456',
                        action: 'test',
                        timestamp: new Date().toISOString()
                    })
                }
            ]
        });

        console.log('\nMessages publiés avec succès!');
        console.log('En attente de messages... (Appuyez sur Ctrl+C pour arrêter)');

    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Exécuter le test
runTest().catch(console.error);

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