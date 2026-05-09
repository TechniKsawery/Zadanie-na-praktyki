import { Request, Response, NextFunction } from 'express';

// MIDDLEWARE DO SPRAWDZANIA UPRAWNIEŃ (ADMIN / MODERATOR / USER)
export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Brak uprawnień. Ta akcja wymaga roli: ' + allowedRoles.join(' lub ') 
      });
    }

    next();
  };
};
