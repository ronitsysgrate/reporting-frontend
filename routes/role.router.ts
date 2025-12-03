import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { createRole, deleteRole, getAllRoles, getRoleById, updateRole } from '../controllers/role.controller';

const roleRouter = Router();

roleRouter.post('/', authenticate, createRole);
roleRouter.get('/', authenticate, getAllRoles);
roleRouter.get('/:roleId', authenticate, getRoleById);
roleRouter.put('/:roleId', authenticate, updateRole);
roleRouter.delete('/:roleId', authenticate, deleteRole);

export default roleRouter;