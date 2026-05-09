import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

// MIDDLEWARE, KTÓRY SPRAWDZA CZY DANE W req.body ZGADZAJĄ SIĘ ZE SCHEMATEM ZOD
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({ 
        error: 'Błąd walidacji danych', 
        details: error.errors 
      });
    }
  };
};
