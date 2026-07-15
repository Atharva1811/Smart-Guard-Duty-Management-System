// server/src/routes/locationRoutes.ts
import { Router } from 'express';
import { getAllLocations, getLocationById, createLocation, updateLocation, deleteLocation } from '../controllers/locationController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validator.js';
import { locationSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', authenticateToken, getAllLocations);
router.get('/:id', authenticateToken, getLocationById);

router.post('/', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'SUPERVISOR'), 
  validateBody(locationSchema), 
  createLocation
);

router.put('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'SUPERVISOR'), 
  validateBody(locationSchema), 
  updateLocation
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'), 
  deleteLocation
);

export default router;
