import { Router } from 'express';
import { login, verifyToken } from '../controllers/authController';
// import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Login without rate limiting for dev
router.post('/login', login);

// Token verification endpoint
router.get('/verify', verifyToken);

export default router;
