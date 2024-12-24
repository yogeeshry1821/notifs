import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createRedisClients } from './services/redis';
import mongoose, { ConnectOptions } from 'mongoose';
import Notification from './models/notiifcations';
dotenv.config();
// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', 
  },
});

// Middleware
app.use(express.json());

// Redis Clients
const { pubClient, subClient } = createRedisClients();

// MongoDB Connection
const uri:any=process.env.MONGODB_URL;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as ConnectOptions).then(()=>console.log('Connected to MongoDB')).catch((err)=>console.log(err));

// Socket.IO Setup
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Redis Subscription
subClient.subscribe('notifications', (message: string) => {
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
app.post('/notify', async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;

    const notification = new Notification({ message, userId });
    await notification.save();

    pubClient.publish('notifications', JSON.stringify(notification));
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

// Start Server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
