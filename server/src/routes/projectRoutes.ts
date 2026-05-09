import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { TaskController } from '../controllers/taskController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const projectController = new ProjectController();
const taskController = new TaskController();

// Wszystkie trasy projektów wymagają zalogowania
router.use(authMiddleware);

// --- PROJEKTY ---
router.get('/', projectController.getAll);
router.post('/', projectController.create);
router.get('/:id', projectController.getOne);
router.patch('/:id', projectController.update);
router.delete('/:id', projectController.delete);

// --- ZADANIA W PROJEKCIE ---
router.get('/:projectId/tasks', taskController.getByProject);
router.post('/:projectId/tasks', taskController.create);

export default router;
