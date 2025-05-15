const { Kafka } = require('kafkajs');

consumeMessages('articles_topic');
consumeMessages('categories_topic');

const kafka = new Kafka({
  clientId: 'decor-app',
  brokers: ['kafka:9092'],
});

const consumer = kafka.consumer({ groupId: 'decor-group' });

const consumeMessages = async (topic) => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`📥 [${topic}] Message reçu : ${message.value.toString()}`);
    },
  });
};

module.exports = consumeMessages;
