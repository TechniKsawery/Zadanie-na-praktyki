import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import teamRoutes from './routes/teamRoutes';
import uploadRoutes from './routes/uploadRoutes';

const app = express();
const httpServer = createServer(app); // TWORZYMY SERWER HTTP DLA SOCKET.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*', // W produkcji ustaw konkretny adres frontendu
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// --- MIDDLEWARES ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

import { registerChatHandlers } from './socketHandlers/chatHandler';

// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
  console.log(`Użytkownik połączony: ${socket.id}`);

  // Rejestrujemy handlery dla czatu
  registerChatHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`Użytkownik rozłączony: ${socket.id}`);
  });
});

// PRZEKAZUJEMY 'io' DO REQUESTA, ŻEBYŚMY MOGLI WYSYŁAĆ NOTYFIKACJE Z KONTROLERÓW
app.use((req, res, next) => {
  (req as any).io = io;
  next();
});

// --- TRASY ---
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send('API Mini Jira SaaS (Etap 4) działa!');
});

// WAŻNE: ODPALAMY httpServer ZAMIAST app
httpServer.listen(PORT, () => {
  console.log(`Serwer SaaS działa na http://localhost:${PORT}`);
});
