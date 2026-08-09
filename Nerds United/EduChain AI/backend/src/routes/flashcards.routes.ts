import { Router } from 'express';
import { createFlashcardSet, getFlashcardSets, submitCardReview } from '../controllers/flashcards.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

router.post('/', createFlashcardSet);
router.get('/', getFlashcardSets);
router.post('/review', submitCardReview);

export default router;
