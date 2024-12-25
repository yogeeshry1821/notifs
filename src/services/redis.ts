import { createClient } from 'redis';

// Function to Create Redis Clients
export const createRedisClients = async () => {
  const pubClient = createClient({
    socket: {
      host: '172.19.44.78', // Replace with your WSL IP address
      port: 6379
    }
  }).on('error', (err) => console.error('Redis error:', err));
  const subClient = pubClient.duplicate();

  // Error Handlers
  pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
  subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

  // Connecting Clients
  try {
    console.log('asdf')
    await pubClient.connect();
    console.log('Redis Pub Client connected.');
    
    await subClient.connect();
    console.log('Redis Sub Client connected.');
  } catch (err) {
    console.error('Redis connection error:', err);
    throw err; // Rethrow error if connection fails
  }

  // Subscribe to the 'notifications' channel
  await subClient.subscribe('notifications', (message, channel) => {
    console.log(`Message from ${channel}: ${message}`);
  });

  return { pubClient, subClient };
};
