import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { catchAsync } from '../lib/errors';
import * as auditController from '../controllers/auditController';

const router = Router();

router.use(authenticateToken, requireAdmin);
router.get('/', catchAsync(auditController.getAuditLogs));

export default router;
