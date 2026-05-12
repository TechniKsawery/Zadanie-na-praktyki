import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new UserController();

router.get('/public', authMiddleware, controller.getPublicUsers);
router.get('/', authMiddleware, controller.getAllUsers);
router.patch('/:id/role', authMiddleware, controller.updateUserRole);
router.delete('/me', authMiddleware, controller.deleteMe);

export default router;
