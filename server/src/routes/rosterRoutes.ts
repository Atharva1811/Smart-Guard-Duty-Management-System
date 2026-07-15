// server/src/routes/rosterRoutes.ts
import { Router } from 'express';
import { getAssignments, generateRoster, saveAssignments, getHistory, getReplacementSuggestions, checkConflicts } from '../controllers/rosterController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.get('/assignments', authenticateToken, getAssignments);
router.post('/generate', authenticateToken, authorizeRoles('ADMIN', 'SUPERVISOR'), generateRoster);
router.post('/save', authenticateToken, authorizeRoles('ADMIN', 'SUPERVISOR'), saveAssignments);
router.get('/history', authenticateToken, getHistory);
router.get('/suggestions', authenticateToken, getReplacementSuggestions);
router.post('/conflicts', authenticateToken, checkConflicts);

export default router;
