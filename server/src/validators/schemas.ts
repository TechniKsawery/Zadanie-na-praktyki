import { z } from 'zod';

// SCHEMAT WALIDACJI DLA TWORZENIA PROJEKTU
export const projectSchema = z.object({
  name: z.string().min(3, "Nazwa projektu musi mieć min. 3 znaki").max(100),
  description: z.string().max(500).optional(),
  team_id: z.string().uuid().nullable().optional(),
});

export const projectUpdateSchema = projectSchema.partial();

// SCHEMAT DLA ZADANIA
export const taskSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  deadline: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  pending_assignee: z.string().uuid().nullable().optional(),
});

export const taskUpdateSchema = taskSchema.partial();

export const teamSchema = z.object({
  name: z.string().min(2, 'Nazwa zespolu jest wymagana').max(100)
});

export const inviteSchema = z.object({
  email: z.string().email('Nieprawidlowy email')
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Tresc jest wymagana').max(2000)
});
