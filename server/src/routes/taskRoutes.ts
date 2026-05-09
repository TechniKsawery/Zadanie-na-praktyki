import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const taskController = new TaskController();

router.use(authMiddleware);

// Operacje na konkretnym zadaniu
router.patch('/:id', taskController.update);
router.patch('/:id/status', taskController.update); // Można użyć tej samej funkcji lub dedykowanej
router.delete('/:id', taskController.delete);

export default router;
