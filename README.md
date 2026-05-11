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
