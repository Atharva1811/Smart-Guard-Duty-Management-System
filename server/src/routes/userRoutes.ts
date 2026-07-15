// server/src/routes/userRoutes.ts
import { Router } from 'express';
import { getAllUsers, deleteUser } from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, authorizeRoles('ADMIN'), getAllUsers);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteUser);

export default router;
