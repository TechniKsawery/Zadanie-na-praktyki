# 🚀 Mini Jira SaaS - System Zarządzania Zespołem (Etap 4)

Profesjonalna platforma SaaS do zarządzania projektami, zespołami oraz komunikacją w czasie rzeczywistym. Projekt spełnia wszystkie wymagania Etapu 4 zadania rekrutacyjnego.

## 🛠️ Stack Technologiczny (Etap 4)

- **Frontend:** React + TypeScript + **Recharts** (Wykresy) + **Socket.IO Client**
- **Backend:** Node.js + Express + TypeScript + **Socket.IO Server** + **Multer**
- **Database:** Supabase (PostgreSQL) + **Supabase Storage** (Pliki)
- **Security:** **Zod** (Walidacja), JWT, RBAC (Role-Based Access Control)

## ✨ Nowe Funkcjonalności (Etap 4)

- 💬 **Real-time Chat:** Czat zespołowy i wiadomości prywatne działające w czasie rzeczywistym.
- 👥 **Zarządzanie Zespołami:** Tworzenie zespołów, zapraszanie członków i przypisywanie ról.
- 📊 **Dashboard Analityczny:** Wizualizacja danych o projektach za pomocą interaktywnych wykresów.
- 📁 **File Management:** Przesyłanie załączników do zadań i projektów.
- 📜 **Activity Feed:** Pełna historia działań użytkowników w systemie.
- 🔔 **Live Notifications:** Powiadomienia toast o ważnych zdarzeniach na żywo.

## 🚀 Instalacja i Uruchomienie

### 1. Wymagania
- Node.js (v18+)
- Konto Supabase

### 2. Instalacja
```bash
npm install
npm run dev
```

### 3. Zmienne Środowiskowe (.env)
Skopiuj `.env.example` do folderu `/server` i uzupełnij:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PORT=5000`

### 4. Konfiguracja Bazy Danych
Wykonaj skrypt SQL `setup_etap4.sql` w panelu Supabase, aby utworzyć tabele: `profiles`, `teams`, `messages`, `activities`, `notifications`.

## 📂 Architektura Projektu (Etap 4)
Zastosowano profesjonalną strukturę warstwową:
- **Validators:** Walidacja danych wejściowych za pomocą Zod.
- **Socket Handlers:** Logika WebSocketów odizolowana od REST API.
- **Services:** Logika biznesowa (Activity, Storage, Teams).
- **Context/Hooks:** Zarządzanie stanem globalnym (Socket, Auth).

---
*Projekt przygotowany przez TechniKsawery jako rozwiązanie zadania rekrutacyjnego.*
