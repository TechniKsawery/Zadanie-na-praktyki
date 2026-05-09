import dotenv from 'dotenv';
// TU WCZYTUJEMY PLIK .ENV NA SAMYM POCZĄTKU, ŻEBY SERWER ZNAŁ KLUCZE DO BAZY DANYCH
dotenv.config(); 

import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARES (WARSTWY POŚREDNIE) ---

// TU POZWALAMY FRONTENDOWI ROZMAWIAĆ Z BACKENDEM (WSZYSTKIE METODY)
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); 

// TU MÓWIMY SERWEROWI, ŻEBY AUTOMATYCZNIE ROZPOZNAWAŁ DANE W FORMACIE JSON
app.use(express.json()); 

// TU LOGUJEMY KAŻDE ZAPYTANIE, ŻEBYŚMY WIDZIELI W KONSOLI, CO ROBI UŻYTKOWNIK
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// --- TRASY (ROUTES) ---

// TU PODPINAMY WSZYSTKIE ŚCIEŻKI DOTYCZĄCE PROJEKTÓW POD ADRES /api/projects
app.use('/api/projects', projectRoutes);

// TU PODPINAMY WSZYSTKIE ŚCIEŻKI DOTYCZĄCE ZADAŃ POD ADRES /api/tasks
app.use('/api/tasks', taskRoutes);

// TU ROBIMY PROSTY TEST, ŻEBY SPRAWDZIĆ CZY SERWER W OGÓLE ŻYJE
app.get('/', (req, res) => {
  res.send('API Mini Jira działa!');
});

// TU ODPALAMY NASZĄ MASZYNĘ I CZEKAMY NA POŁĄCZENIA
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
