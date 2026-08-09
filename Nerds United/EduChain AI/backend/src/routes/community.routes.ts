import { Router } from 'express';
import { getStudyRooms, createStudyRoom, getRoomMessages, sendMessage } from '../controllers/community.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);
router.get('/rooms', getStudyRooms);
router.post('/rooms', createStudyRoom);
router.get('/rooms/:roomId/messages', getRoomMessages);
router.post('/messages', sendMessage);

export default router;
