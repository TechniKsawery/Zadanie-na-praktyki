import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { CommentController } from '../controllers/commentController';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validateMiddleware';
import { taskUpdateSchema, commentSchema } from '../validators/schemas';

const router = Router();
const taskController = new TaskController();
const commentController = new CommentController();

router.use(authMiddleware);

// Operacje na konkretnym zadaniu
router.patch('/:id', validate(taskUpdateSchema), taskController.update);
router.patch('/:id/status', validate(taskUpdateSchema), taskController.update);
router.delete('/:id', taskController.delete);

// Akceptacja (Etap 4+)
router.post('/:id/approve', taskController.approve);
router.post('/:id/approve-reassignment', taskController.approveReassignment);

// Komentarze
router.get('/:taskId/comments', commentController.getByTask);
router.post('/:taskId/comments', validate(commentSchema), commentController.create);

export default router;
