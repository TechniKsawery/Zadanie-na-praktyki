# 🚀 Mini Jira - System Zarządzania Projektami

Profesjonalna aplikacja typu **Project Management System** (inspirowana Jira/Trello), zbudowana w architekturze Monorepo. Projekt zrealizowany jako zadanie rekrutacyjne (Etap 1, 2 i 3).

## 🛠️ Stack Technologiczny

### Frontend
- **React** + **Vite** + **TypeScript**
- **React Router** (nawigacja i ochrona tras)
- **Axios** (komunikacja z API + Interceptory dla Auth)
- **Vanilla CSS** (Custom Design System, Dark Mode vibes)

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Layered Architecture** (Routes -> Controllers -> Services -> Repositories)
- **CORS** & **Environment Variables** (dotenv)

### Database & Security
- **Supabase** (PostgreSQL)
- **Supabase Auth** (JWT Authentication)
- **RLS (Row Level Security)** – pełna izolacja danych użytkowników na poziomie bazy danych.

## ✨ Kluczowe Funkcjonalności

- 🔐 **Pełna Autoryzacja:** Rejestracja, logowanie i wylogowanie z sesją.
- 📂 **Zarządzanie Projektami (CRUD):** Tworzenie, wyświetlanie, edycja i usuwanie projektów.
- 📋 **Tablica Kanban:** Dynamiczne zarządzanie zadaniami w 3 kolumnach (To Do, In Progress, Done).
- ⚙️ **Szczegóły Zadań:** Tytuł, Opis, Priorytet (Low/Medium/High), Osoba przypisana oraz Termin (Deadline).
- 🛡️ **Bezpieczeństwo:** 
  - Walidacja terminów (blokada dat wstecznych).
  - Ochrona tras frontendu (tylko dla zalogowanych).
  - Middleware autoryzacyjny na backendzie weryfikujący tokeny JWT.

## 🚀 Szybki Start (Local Setup)

### 1. Klonowanie i Instalacja
```bash
git clone <url-twojego-repo>
cd Wmedia_zadanie_praktyki
npm install
```

### 2. Konfiguracja Środowiska
Utwórz plik `.env` w folderze `/server` oraz odpowiedni plik konfiguracyjny w `/client` (zgodnie z `.env.example`).
Wymagane klucze: `SUPABASE_URL` oraz `SUPABASE_ANON_KEY`.

### 3. Konfiguracja Bazy Danych
Wykonaj skrypt SQL znajdujący się w pliku `update_tasks.sql` (lub `supabase_setup.sql`) w panelu **SQL Editor** na platformie Supabase, aby utworzyć tabele i polityki RLS.

### 4. Uruchomienie Aplikacji
Dzięki strukturze Monorepo, obie części (klient i serwer) uruchomisz jedną komendą z głównego folderu:
```bash
npm run dev
```

## 📂 Struktura Projektu
- `/client` - Aplikacja React (Vite)
- `/server` - API Express (Node.js)
- `/server/src/middlewares` - Logika bezpieczeństwa i weryfikacja tokenów
- `/server/src/repositories` - Bezpośrednia komunikacja z bazą danych

---
*Projekt przygotowany z dbałością o czystość kodu i bezpieczeństwo danych.*
