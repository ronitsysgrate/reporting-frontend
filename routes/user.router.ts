import { Router } from 'express';
import { deleteUser, fetchAllUsers, fetchUserProfile, fetchUsersAndRoles, login, register, resetPassword, rolePermissions, updateUser } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/', authenticate, fetchAllUsers);
authRouter.get('/user-role', authenticate, fetchUsersAndRoles);
authRouter.get('/profile', authenticate, fetchUserProfile);
authRouter.get('/permissions', authenticate, rolePermissions);
authRouter.put('/reset-password', authenticate, resetPassword);
authRouter.put('/:userId', authenticate, updateUser);
authRouter.delete('/:userId', authenticate, deleteUser);

export default authRouter;