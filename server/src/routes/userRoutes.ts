import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new UserController();

router.get('/', authMiddleware, controller.getAllUsers);

export default router;
