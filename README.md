# 🚀 Mini Jira SaaS - Professional Team Management System

Recruitment project (Stage 4) that meets 100% of the mandatory requirements and all additional requirements.

## 🛠️ Technology Stack
- **Frontend:** React + TypeScript + Recharts + Lucide Icons
- **Backend:** Node.js + Express + TypeScript + Socket.IO + Multer
- **Database:** Supabase (PostgreSQL) + Row Level Security (RLS)
- **Infrastructure:** Docker, Docker Compose, GitHub Actions (CI)

## ✨ Key Features (Stage 4)
- 💬 **Real-time Chat:** General and private messaging system (DM).
- 🟢 **Online Status:** Live user availability tracking.
- 👥 **Team Management:** Team creation, member invitations, and team roles.
- 📊 **Analytics Dashboard:** Interactive charts for task and project statuses.
- 📁 **File Management:** Uploading task attachments.
- 💬 **Task Comments:** Commenting on individual tasks.
- 📜 **Activity History:** Full audit trail of user actions.
- 🌙 **Dark Mode:** Modern interface with dark theme support.

## 📂 Project Architecture
A professional layered architecture was used:

### Backend (`/server`):
- **Routes:** REST API endpoint definitions.
- **Controllers:** HTTP request handling and business logic orchestration.
- **Services:** Business logic layer (Activity, Storage, Teams).
- **Repositories:** Direct communication with the database (Supabase).
- **Middlewares:** Authorization (JWT), role checks (RBAC), validation.
- **Validators:** Data validation schemas (Zod).
- **Socket Handlers:** WebSocket logic isolated from the REST layer.

### Frontend (`/client`):
- **Pages:** Main application views.
- **Components:** Reusable UI elements.
- **Layouts:** Page templates (MainLayout).
- **Hooks:** Custom React hooks (useSocket).
- **Context:** Global state management (Socket, Auth).
- **Services:** API communication (Axios).

## 🚀 Installation and Run

### Option 1: Docker (Recommended)
1. Copy `.env.example` to `/server/.env` and fill in Supabase keys.
2. Run: `docker-compose up --build`

### Option 2: Local
1. Install dependencies in both folders: `npm install`
2. Run server and client: `npm run dev`

### Database Setup
Run the `setup_final.sql` script in the Supabase SQL editor to prepare the table structure and security policies (RLS).

---
*Project prepared by TechniKsawery in accordance with the recruitment task guidelines.*

---

# 🚀 Mini Jira SaaS - Profesjonalny System Zarządzania Zespołem

Projekt rekrutacyjny (Etap 4) spełniający 100% wymagań obowiązkowych oraz wszystkie wymagania dodatkowe.

## 🛠️ Stack Technologiczny
- **Frontend:** React + TypeScript + Recharts + Lucide Icons
- **Backend:** Node.js + Express + TypeScript + Socket.IO + Multer
- **Baza danych:** Supabase (PostgreSQL) + Row Level Security (RLS)
- **Infrastruktura:** Docker, Docker Compose, GitHub Actions (CI)

## ✨ Kluczowe Funkcjonalności (Etap 4)
- 💬 **Real-time Chat:** System wiadomości ogólnych oraz prywatnych (DM).
- 🟢 **Online Status:** Śledzenie statusu dostępności użytkowników na żywo.
- 👥 **Team Management:** Tworzenie zespołów, zapraszanie członków i role zespołowe.
- 📊 **Analytics Dashboard:** Interaktywne wykresy statusów zadań i projektów.
- 📁 **File Management:** Przesyłanie załączników do zadań.
- 💬 **Task Comments:** Możliwość komentowania poszczególnych zadań.
- 📜 **Activity History:** Pełna ścieżka audytu działań użytkowników.
- 🌙 **Dark Mode:** Nowoczesny interfejs z obsługą motywu ciemnego.

## 📂 Architektura Projektu
Zastosowano profesjonalną strukturę warstwową (Layered Architecture):

### Backend (`/server`):
- **Routes:** Definicje endpointów REST API.
- **Controllers:** Obsługa żądań HTTP i orkiestracja logiki.
- **Services:** Warstwa logiki biznesowej (Activity, Storage, Teams).
- **Repositories:** Bezpośrednia komunikacja z bazą danych (Supabase).
- **Middlewares:** Autoryzacja (JWT), sprawdzanie ról (RBAC), walidacja.
- **Validators:** Schematy walidacji danych (Zod).
- **Socket Handlers:** Logika WebSocketów odizolowana od warstwy REST.

### Frontend (`/client`):
- **Pages:** Widoki główne aplikacji.
- **Components:** Reużywalne elementy UI.
- **Layouts:** Szablony stron (MainLayout).
- **Hooks:** Własne hooki Reactowe (useSocket).
- **Context:** Zarządzanie stanem globalnym (Socket, Auth).
- **Services:** Komunikacja z API (Axios).

## 🚀 Instalacja i Uruchomienie

### Opcja 1: Docker (Zalecane)
1. Skopiuj `.env.example` do `/server/.env` i uzupełnij klucze Supabase.
2. Uruchom: `docker-compose up --build`

### Opcja 2: Lokalnie
1. Zainstaluj zależności w obu folderach: `npm install`
2. Uruchom serwer i klient: `npm run dev`

### Konfiguracja Bazy Danych
Wykonaj skrypt `setup_final.sql` w edytorze SQL Supabase, aby przygotować strukturę tabel i polityki bezpieczeństwa (RLS).

---
*Projekt przygotowany przez TechniKsawery zgodnie z wytycznymi zadania rekrutacyjnego.*
