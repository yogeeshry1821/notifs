import { createClient } from 'redis';

// Function to Create Redis Clients
export const createRedisClients = () => {
  const pubClient = createClient();
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
  subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

  pubClient.connect();
  subClient.connect();
  
  subClient.subscribe('notifications', (message, channel) => {
    console.log(`Message from ${channel}: ${message}`);
  });

  return { pubClient, subClient };
};
