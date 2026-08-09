import { Router } from 'express';
import { getCertificates, verifyCertificate, mintCertificate, hashAssignment } from '../controllers/certificates.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/verify/:assetId', verifyCertificate); // Public verify endpoint
router.use(authenticateJWT);
router.get('/', getCertificates);
router.post('/mint', mintCertificate);
router.post('/hash-assignment', hashAssignment);

export default router;
