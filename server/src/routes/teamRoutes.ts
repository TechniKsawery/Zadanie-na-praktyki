import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { authMiddleware } from '../middlewares/auth';
import { checkRole } from '../middlewares/roleMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { teamSchema, inviteSchema } from '../validators/schemas';

const router = Router();
const teamController = new TeamController();

// Wszystkie trasy zespołów wymagają logowania
router.use(authMiddleware);

// Pobieranie moich zespołów i tworzenie nowych (każdy może)
router.get('/', teamController.listMyTeams);
router.post('/', validate(teamSchema), teamController.create);

// Zarządzanie członkami i zaproszenia
router.get('/invitations', teamController.listInvitations);
router.post('/invitations/:teamId/accept', teamController.acceptInvitation);
router.get('/:teamId/members', teamController.getMembers);
router.post('/:teamId/invite', validate(inviteSchema), teamController.invite);
router.delete('/:teamId', teamController.deleteTeam);
router.delete('/:teamId/members/:userId', teamController.removeMember);

export default router;
