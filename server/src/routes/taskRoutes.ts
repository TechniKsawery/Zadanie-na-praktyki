import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { CommentController } from '../controllers/commentController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const taskController = new TaskController();
const commentController = new CommentController();

router.use(authMiddleware);

// Operacje na konkretnym zadaniu
router.patch('/:id', taskController.update);
router.patch('/:id/status', taskController.update);
router.delete('/:id', taskController.delete);

// Komentarze
router.get('/:taskId/comments', commentController.getByTask);
router.post('/:taskId/comments', commentController.create);

export default router;
