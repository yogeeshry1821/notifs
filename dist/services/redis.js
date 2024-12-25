"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClients = void 0;
const redis_1 = require("redis");
// Function to Create Redis Clients
const createRedisClients = () => __awaiter(void 0, void 0, void 0, function* () {
    const pubClient = (0, redis_1.createClient)({
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
        console.log('asdf');
        yield pubClient.connect();
        console.log('Redis Pub Client connected.');
        yield subClient.connect();
        console.log('Redis Sub Client connected.');
    }
    catch (err) {
        console.error('Redis connection error:', err);
        throw err; // Rethrow error if connection fails
    }
    // Subscribe to the 'notifications' channel
    yield subClient.subscribe('notifications', (message, channel) => {
        console.log(`Message from ${channel}: ${message}`);
    });
    return { pubClient, subClient };
});
exports.createRedisClients = createRedisClients;
