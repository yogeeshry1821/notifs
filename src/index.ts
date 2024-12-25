import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createRedisClients } from './services/redis';
import mongoose, { ConnectOptions } from 'mongoose';
import Notification from './models/notiifcations';
import Joi from 'joi';

dotenv.config();

// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL as string, {
    useNewUrlParser: true,
  } as ConnectOptions)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

// Input Validation Schema
const notifySchema = Joi.object({
  message: Joi.string().required(),
  userId: Joi.string().required(),
});

// Main Async Block
(async () => {
  try {
    const { pubClient, subClient } = await createRedisClients();

    // Redis Subscription
    await subClient.subscribe('notifications', (message: string) => {
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
    app.post('/notify', async (req: Request, res: Response) => {
      const { error } = notifySchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
      return;
      }

      try {
        const { message, userId } = req.body;
        const notification = new Notification({ message, userId });
        await notification.save();
        await pubClient.publish('notifications', JSON.stringify(notification));
        res.status(200).json({ message: 'Notification sent!' });
      } catch (err) {
        res.status(500).json({ error: 'Failed to send notification' });
      }
    });

    app.get('/notifications/:userId', async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const notifications = await Notification.find({ userId });
        res.status(200).json(notifications);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
      }
    });

    // Graceful Shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      await pubClient.quit();
      await subClient.quit();
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    });

    // Start Server
    const PORT = 3000;
    server.listen(PORT, () => {
      console.log(`WebSocket server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize Redis or start server:', err);
    process.exit(1); // Exit with failure
  }
})();
