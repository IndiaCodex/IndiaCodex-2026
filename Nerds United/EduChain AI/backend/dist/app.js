"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
// WebSocket Setup
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // Allow all for development; restrict in prod env
        methods: ['GET', 'POST']
    }
});
exports.io = io;
// Security & Body Parsers
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false // Allow assets to load in cross-origin environments
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/v1', routes_1.default);
// Root Health Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});
// Real-Time WebSocket Logic
io.on('connection', (socket) => {
    console.log(`User connected to WebSocket: ${socket.id}`);
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });
    socket.on('send_message', (data) => {
        io.to(data.roomId).emit('receive_message', data);
    });
    socket.on('typing', (data) => {
        socket.to(data.roomId).emit('user_typing', data);
    });
    socket.on('disconnect', () => {
        console.log(`User disconnected from WebSocket: ${socket.id}`);
    });
});
// Global Error Middleware
app.use((err, req, res, next) => {
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
