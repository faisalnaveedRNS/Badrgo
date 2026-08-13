import { KafkaOptions, Transport } from '@nestjs/microservices';

export const kafkaBrokers = (): string[] => (process.env.KAFKA_BROKERS || 'localhost:9092').split(',').map((broker) => broker.trim());

/**
 * Microservice options for an app that *consumes* Kafka messages.
 * `clientId` identifies the app, `groupId` the consumer group it joins.
 */
export const kafkaConsumerOptions = (clientId: string, groupId: string): KafkaOptions => ({
  transport: Transport.KAFKA,
  options: {
    client: { clientId, brokers: kafkaBrokers() },
    consumer: { groupId, allowAutoTopicCreation: true },
    subscribe: { fromBeginning: false },
  },
});
