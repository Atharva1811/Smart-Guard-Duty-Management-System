// server/src/routes/rosterRoutes.ts
import { Router } from 'express';
import { getAssignments, generateRoster, saveAssignments, getHistory, getReplacementSuggestions, checkConflicts, lockAssignment, unlockAssignment } from '../controllers/rosterController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.get('/assignments', authenticateToken, getAssignments);
router.post('/generate', authenticateToken, authorizeRoles('ADMIN', 'SUPERVISOR'), generateRoster);
router.post('/save', authenticateToken, authorizeRoles('ADMIN', 'SUPERVISOR'), saveAssignments);
router.get('/history', authenticateToken, getHistory);
router.get('/suggestions', authenticateToken, getReplacementSuggestions);
router.post('/conflicts', authenticateToken, checkConflicts);
router.post('/lock', authenticateToken, authorizeRoles('ADMIN', 'SUPERVISOR'), lockAssignment);
router.post('/unlock', authenticateToken, authorizeRoles('ADMIN', 'SUPERVISOR'), unlockAssignment);

export default router;
