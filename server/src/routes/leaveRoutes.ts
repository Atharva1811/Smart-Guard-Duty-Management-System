// server/src/routes/leaveRoutes.ts
import { Router } from 'express';
import { getAllLeaves, createLeave, updateLeaveStatus } from '../controllers/leaveController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validator.js';
import { leaveSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', authenticateToken, getAllLeaves);
router.post('/', authenticateToken, validateBody(leaveSchema), createLeave);

router.put('/:id/status', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'SUPERVISOR'), 
  updateLeaveStatus
);

export default router;
