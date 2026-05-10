import { Router } from 'express';
import { ActivityController } from '../controllers/activityController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new ActivityController();

// Pobieranie historii aktywności (wymaga bycia zalogowanym)
router.get('/', authMiddleware, controller.getHistory);

export default router;
