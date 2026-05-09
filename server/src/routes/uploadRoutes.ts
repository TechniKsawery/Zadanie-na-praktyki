import { Router, Request, Response } from 'express';
import multer from 'multer';
import { StorageService } from '../services/storageService';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const storage = multer({ storage: multer.memoryStorage() }); // PLIKI W PAMIĘCI RAM PRZED WYSEŁKĄ
const storageService = new StorageService();

router.post('/', authMiddleware, storage.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak pliku w żądaniu' });
    }

    const supabase = (req as any).supabase;
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = `uploads/${fileName}`;

    const result = await storageService.uploadFile(
      supabase,
      filePath,
      req.file.buffer,
      req.file.mimetype
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
