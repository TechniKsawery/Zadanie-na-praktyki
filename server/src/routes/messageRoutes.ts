import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { MessageController } from '../controllers/messageController';

const router = Router();
const controller = new MessageController();

router.use(authMiddleware);

router.get('/global', controller.getGlobal);
router.get('/private/:userId', controller.getPrivate);

export default router;
