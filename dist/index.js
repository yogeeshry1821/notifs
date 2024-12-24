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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const redis_1 = require("./services/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const notiifcations_1 = __importDefault(require("./models/notiifcations"));
dotenv_1.default.config();
// Initialize app and server
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
// Middleware
app.use(express_1.default.json());
// Redis Clients
const { pubClient, subClient } = (0, redis_1.createRedisClients)();
// MongoDB Connection
const uri = process.env.MONGODB_URL;
mongoose_1.default.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB')).catch((err) => console.log(err));
// Socket.IO Setup
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
// Redis Subscription
subClient.subscribe('notifications', (message) => {
    const notification = JSON.parse(message);
    io.emit('receive_notification', notification);
});
subClient.on('message', (channel, message) => {
    if (channel === 'notifications') {
        const notification = JSON.parse(message);
        io.emit('receive_notification', notification);
    }
});
// API Endpoints
app.post('/notify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message, userId } = req.body;
        const notification = new notiifcations_1.default({ message, userId });
        yield notification.save();
        pubClient.publish('notifications', JSON.stringify(notification));
        res.status(200).json({ message: 'Notification sent!' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to send notification' });
    }
}));
app.get('/notifications/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const notifications = yield notiifcations_1.default.find({ userId });
        res.status(200).json(notifications);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
}));
// Start Server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
