import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { authMiddleware } from '../middlewares/auth';
import { checkRole } from '../middlewares/roleMiddleware';

const router = Router();
const teamController = new TeamController();

// Wszystkie trasy zespołów wymagają logowania
router.use(authMiddleware);

// Pobieranie moich zespołów i tworzenie nowych (każdy może)
router.get('/', teamController.listMyTeams);
router.post('/', teamController.create);

// Zarządzanie członkami i zaproszenia (wymaga bycia zalogowanym)
router.get('/:teamId/members', teamController.getMembers);
router.post('/:teamId/invite', teamController.invite);

export default router;
