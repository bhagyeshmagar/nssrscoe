import { Router } from 'express';
import { login, verifyToken } from '../controllers/authController';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Login with rate limiting
router.post('/login', loginRateLimiter, login);

// Token verification endpoint
router.get('/verify', verifyToken);

export default router;
