import { Router } from 'express';
import { login, verifyToken } from '../controllers/authController';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', loginRateLimiter, login);
router.get('/verify', verifyToken);

export default router;
