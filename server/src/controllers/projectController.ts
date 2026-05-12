import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { ActivityService } from '../services/activityService';

// TU TWORZYMY INSTANCJĘ SERWISU, KTÓRY WYKONA DLA NAS BRUDNĄ ROBOTĘ (LOGIKĘ)
const projectService = new ProjectService();

export class ProjectController {
  // GET /api/projects
  // TU OBSŁUGUJEMY POBIERANIE WSZYSTKICH PROJEKTÓW UŻYTKOWNIKA
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const supabase = (req as any).supabase;
      
      const projects = await projectService.listUserProjects(supabase, userId);
      res.json(projects);
    } catch (err: any) {
      console.error('[ProjectController.getAll] ERROR:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/projects
  // TU OBSŁUGUJEMY TWORZENIE NOWEGO PROJEKTU
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const supabase = (req as any).supabase;
      const { name, description, team_id } = req.body;
      
      // TU PRZEKAZUJEMY DANE DO SERWISU, ŻEBY STWORZYŁ WPIS W BAZIE
      const newProject = await projectService.createNewProject(supabase, name, description, userId, team_id);
      
      if (!newProject) {
        throw new Error('Nie udało się utworzyć projektu. Sprawdź uprawnienia bazy danych.');
      }

      // LOGUJEMY AKTYWNOŚĆ (ETAP 4)
      await ActivityService.log(supabase, userId, `utworzył projekt: ${name}`, newProject.id);

      const io = (req as any).io;
      if (io) {
        if (team_id) {
          io.to(`team_${team_id}`).emit('receive_notification', {
            title: 'Projekt',
            content: `Nowy projekt w zespole: ${name}`
          });
        } else {
          io.to(`user_${userId}`).emit('receive_notification', {
            title: 'Projekt',
            content: `Utworzono projekt: ${name}`
          });
        }
      }

      // TU POTWIERDZAMY FRONTENDOWI, ŻE SIĘ UDAŁO (STATUS 201 - CREATED)
      res.status(201).json(newProject);
    } catch (err: any) {
      console.error('[ProjectController.create] CRITICAL ERROR:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // GET /api/projects/:id
  async getOne(req: Request, res: Response) {
    try {
      const supabase = (req as any).supabase;
      const project = await projectService.getProject(supabase, req.params.id as string);
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // PATCH /api/projects/:id
  async update(req: Request, res: Response) {
    try {
      const supabase = (req as any).supabase;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const updated = await projectService.updateProject(supabase, req.params.id as string, req.body, userId, userRole);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // DELETE /api/projects/:id
  // TU OBSŁUGUJEMY USUWANIEM PROJEKTU
  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const supabase = (req as any).supabase;
      
      // TU MÓWIMY SERWISOWI, KTÓRE ID PROJEKTU MA USUNĄĆ
      await projectService.deleteProject(supabase, req.params.id as string, userId, userRole);
      
      // LOGUJEMY AKTYWNOŚĆ (ETAP 4)
      await ActivityService.log(supabase, userId, `usunął projekt o ID: ${req.params.id}`);

      res.json({ message: 'Projekt usunięty' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
