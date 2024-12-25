import { createClient } from 'redis';

export const createRedisClients = async () => {
  const pubClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  const subClient = pubClient.duplicate();

  // Log connection and errors
  pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
  subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

  pubClient.on('connect', () => console.log('Redis Pub Client connected'));
  subClient.on('connect', () => console.log('Redis Sub Client connected'));

  // Ensure clients are ready
  await pubClient.connect();
  await subClient.connect();

  return { pubClient, subClient };
};
