"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClients = void 0;
const redis_1 = require("redis");
// Function to Create Redis Clients
const createRedisClients = () => {
    const pubClient = (0, redis_1.createClient)();
    const subClient = pubClient.duplicate();
    pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
    subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));
    pubClient.connect();
    subClient.connect();
    return { pubClient, subClient };
};
exports.createRedisClients = createRedisClients;
