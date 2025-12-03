import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { createZoomUser, deleteZoomUser, getAllZoomUsers, getZoomUserById, updateZoomUser } from '../controllers/zoom.controller';

const zoomRouter = Router();

zoomRouter.get('/', authenticate, getAllZoomUsers);
zoomRouter.get('/:zoomUserId', authenticate, getZoomUserById);
zoomRouter.post('/', authenticate, createZoomUser);
zoomRouter.put('/:zoomUserId', authenticate, updateZoomUser);
zoomRouter.delete('/:zoomUserId', authenticate, deleteZoomUser);

export default zoomRouter;