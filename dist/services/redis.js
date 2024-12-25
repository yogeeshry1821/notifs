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
const createRedisClients = () => __awaiter(void 0, void 0, void 0, function* () {
    const pubClient = (0, redis_1.createClient)({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    const subClient = pubClient.duplicate();
    // Log connection and errors
    pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
    subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));
    pubClient.on('connect', () => console.log('Redis Pub Client connected'));
    subClient.on('connect', () => console.log('Redis Sub Client connected'));
    // Ensure clients are ready
    yield pubClient.connect();
    yield subClient.connect();
    return { pubClient, subClient };
});
exports.createRedisClients = createRedisClients;
