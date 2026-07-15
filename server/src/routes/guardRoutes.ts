// server/src/routes/guardRoutes.ts
import { Router } from 'express';
import { getAllGuards, getGuardById, createGuard, updateGuard, deleteGuard } from '../controllers/guardController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validator.js';
import { guardSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', authenticateToken, getAllGuards);
router.get('/:id', authenticateToken, getGuardById);

router.post('/', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'SUPERVISOR'), 
  validateBody(guardSchema), 
  createGuard
);

router.put('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'SUPERVISOR'), 
  validateBody(guardSchema), 
  updateGuard
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'), 
  deleteGuard
);

export default router;
