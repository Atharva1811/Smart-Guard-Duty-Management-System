// server/src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, refresh, logout, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validator.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/profile', authenticateToken, getProfile);

export default router;
