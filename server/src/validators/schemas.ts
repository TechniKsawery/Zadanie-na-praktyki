import { z } from 'zod';

// SCHEMAT WALIDACJI DLA TWORZENIA PROJEKTU
export const projectSchema = z.object({
  name: z.string().min(3, "Nazwa projektu musi mieć min. 3 znaki").max(100),
  description: z.string().max(500).optional(),
});

// SCHEMAT DLA ZADANIA
export const taskSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  deadline: z.string().nullable().optional(),
});
