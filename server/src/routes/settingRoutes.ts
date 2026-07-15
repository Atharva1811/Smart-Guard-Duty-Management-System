// server/src/routes/settingRoutes.ts
import { Router } from 'express';
import { getSettings, saveSettings } from '../controllers/settingController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getSettings);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'SUPERVISOR'), saveSettings);

export default router;
