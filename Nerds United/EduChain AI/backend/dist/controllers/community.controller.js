"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getRoomMessages = exports.createStudyRoom = exports.getStudyRooms = void 0;
const db_1 = __importDefault(require("../config/db"));
const getStudyRooms = async (req, res) => {
    try {
        const rooms = await db_1.default.studyRoom.findMany({
            include: { host: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ rooms });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getStudyRooms = getStudyRooms;
const createStudyRoom = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name)
            return res.status(400).json({ error: 'name required' });
        const room = await db_1.default.studyRoom.create({
            data: { name, description, hostId: req.user.id, isLive: true },
        });
        return res.status(201).json({ room });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.createStudyRoom = createStudyRoom;
const getRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const messages = await db_1.default.message.findMany({
            where: { roomId },
            include: { sender: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
            orderBy: { createdAt: 'asc' },
            take: 100,
        });
        return res.status(200).json({ messages });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getRoomMessages = getRoomMessages;
const sendMessage = async (req, res) => {
    try {
        const { roomId, content, type = 'TEXT' } = req.body;
        if (!roomId || !content)
            return res.status(400).json({ error: 'roomId and content required' });
        const message = await db_1.default.message.create({
            data: { senderId: req.user.id, roomId, content, type },
            include: { sender: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
        });
        return res.status(201).json({ message });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.sendMessage = sendMessage;
