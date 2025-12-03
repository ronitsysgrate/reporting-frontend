import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { agentLoginLogoutReport, agentStatusDurationReport, refreshAgentsAPI } from '../controllers/timecard.controller';

const timecardRouter = Router();

timecardRouter.get('/login-logout', authenticate, agentLoginLogoutReport);
timecardRouter.get('/status', authenticate, agentStatusDurationReport);
timecardRouter.get('/refresh', authenticate, refreshAgentsAPI);

export default timecardRouter;