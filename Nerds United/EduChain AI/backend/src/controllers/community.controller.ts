import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';

export const getStudyRooms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rooms = await prisma.studyRoom.findMany({
      include: { host: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ rooms });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createStudyRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    const room = await prisma.studyRoom.create({
      data: { name, description, hostId: req.user!.id, isLive: true },
    });
    return res.status(201).json({ room });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getRoomMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: { sender: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    return res.status(200).json({ messages });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId, content, type = 'TEXT' } = req.body;
    if (!roomId || !content) return res.status(400).json({ error: 'roomId and content required' });

    const message = await prisma.message.create({
      data: { senderId: req.user!.id, roomId, content, type },
      include: { sender: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
    });

    return res.status(201).json({ message });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
