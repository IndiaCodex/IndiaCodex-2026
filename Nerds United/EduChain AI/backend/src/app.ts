import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRouter from './routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// WebSocket Setup
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all for development; restrict in prod env
    methods: ['GET', 'POST']
  }
});

// Security & Body Parsers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow assets to load in cross-origin environments
}));
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', apiRouter);

// Root Health Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

// Real-Time WebSocket Logic
io.on('connection', (socket) => {
  console.log(`User connected to WebSocket: ${socket.id}`);

  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', (data: { roomId: string; senderId: string; content: string }) => {
    io.to(data.roomId).emit('receive_message', data);
  });

  socket.on('typing', (data: { roomId: string; username: string; isTyping: boolean }) => {
    socket.to(data.roomId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected from WebSocket: ${socket.id}`);
  });
});

// Global Error Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`EduChain AI backend running on port ${PORT}`);
});

export { app, server, io };
