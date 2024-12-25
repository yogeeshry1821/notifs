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
const notifcations_1 = __importDefault(require("./models/notifcations"));
const joi_1 = __importDefault(require("joi"));
dotenv_1.default.config();
// Initialize app and server
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
// Middleware
app.use(express_1.default.json());
// MongoDB Connection
mongoose_1.default
    .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error(err));
// Input Validation Schema
const notifySchema = joi_1.default.object({
    message: joi_1.default.string().required(),
    userId: joi_1.default.string().required(),
});
// Main Async Block
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pubClient, subClient } = yield (0, redis_1.createRedisClients)();
        // Redis Subscription
        yield subClient.subscribe('notifications', (message) => {
            const notification = JSON.parse(message);
            io.emit('receive_notification', notification);
        });
        // Socket.IO Setup
        io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);
            });
        });
        // API Endpoints
        app.post('/notify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            const { error } = notifySchema.validate(req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            try {
                const { message, userId } = req.body;
                const notification = new notifcations_1.default({ message, userId });
                yield notification.save();
                yield pubClient.publish('notifications', JSON.stringify(notification));
                res.status(200).json({ message: 'Notification sent!' });
            }
            catch (err) {
                res.status(500).json({ error: 'Failed to send notification' });
            }
        }));
        app.get('/notifications/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const notifications = yield notifcations_1.default.find({ userId });
                res.status(200).json(notifications);
            }
            catch (err) {
                res.status(500).json({ error: 'Failed to fetch notifications' });
            }
        }));
        // Graceful Shutdown
        process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
            console.log('Shutting down gracefully...');
            yield pubClient.quit();
            yield subClient.quit();
            server.close(() => {
                console.log('Server closed.');
                process.exit(0);
            });
        }));
        // Start Server
        const PORT = 3000;
        server.listen(PORT, () => {
            console.log(`WebSocket server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Failed to initialize Redis or start server:', err);
        process.exit(1); // Exit with failure
    }
}))();
