# SAS Academy Dashboard

## Overview
A bilingual (English/Arabic) football academy management dashboard for **Sudani Academy Sport (SAS)**. Built with React, Express, PostgreSQL, and Tailwind CSS. Currency: SAR (Saudi Riyal).

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Internationalization**: i18next with English and Arabic support (RTL)
- **Charts**: Recharts for data visualization
- **Routing**: Wouter

## Key Features
- Dashboard with stats, charts, and recent activity
- Player management with age group categorization (U-8 to Senior)
- Coach management (CRUD with specialty, salary tracking)
- Monthly fee collection from players (default 110 SAR)
- Coach salary payment tracking
- Expenditure tracking with categories
- Reports section with income vs expenses, player stats
- Arabic/English language toggle with full RTL support
- Light/Dark theme toggle
- SAS Academy branding with custom logo

## Database Schema
- `users` - Authentication (id, username, password)
- `families` - Family groups for siblings (name, nameAr, customFee nullable)
- `players` - Player profiles (playerCode, name, nameAr, ageGroup, position, age, jerseyNumber, nationality, phone, status, joinDate, monthlyFee, familyId, photoUrl, idDocumentUrl)
  - `playerCode` - Auto-generated unique 4-digit code based on age group (e.g., U-8→08xx, U-12→12xx, Senior→99xx)
  - `familyId` - Optional link to a family group
  - `photoUrl` - Player photo file path
  - `idDocumentUrl` - Identity document file path
- `coaches` - Coach profiles (name, nameAr, phone, specialty, monthlySalary, status, joinDate)
- `expenditures` - Expense tracking (category, description, amount, date)
- `fee_payments` - Monthly fee collection from players (playerId, amount, month, year, status, paidDate)
- `salary_payments` - Coach salary records (coachId, amount, month, year, status, paidDate)
- `sessions` - Training session dates (date, notes)
- `attendance` - Player attendance per session (sessionId, playerId, present boolean)

## API Endpoints
- `/api/dashboard/stats` - Dashboard statistics
- `/api/players` - Player CRUD (playerCode auto-generated on create)
- `/api/coaches` - Coach CRUD
- `/api/fee-payments` - Fee collection CRUD
- `/api/expenditures` - Expenditure CRUD
- `/api/salary-payments` - Coach salary CRUD
- `/api/families` - Family CRUD (with members)
- `/api/families/:id/collect-fees` - Batch fee collection for all active family members
- `/api/sessions` - Session CRUD (training sessions for attendance)
- `/api/sessions/:id/attendance` - GET/POST attendance records for a session
- `/api/upload` - File upload (POST, multipart/form-data, returns {url})
- `/uploads/*` - Static file serving for uploaded files

## File Structure
- `shared/schema.ts` - Database schema and Zod validation
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations (DatabaseStorage class)
- `server/db.ts` - Database connection
- `client/src/lib/i18n.ts` - Internationalization config (EN/AR)
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/components/header.tsx` - Top header with sidebar trigger
- `client/src/pages/` - Dashboard, Players, Coaches, Families, Attendance, Fees, Expenditures, Salaries, Reports, Settings
- `client/src/pages/settings.tsx` - Settings page (theme, color theme, language)

## Running
- `npm run dev` starts both frontend and backend
- Database schema pushed via `npm run db:push`

## Theme
- 4 color theme presets: Green (default), Blue, Red/Gold, Purple — switchable from Settings page
- Fonts: Inter (English), Cairo (Arabic) — loaded from Google Fonts
- Sidebar: Dark-tinted to match active color theme
- Full dark mode support
- Theme/language/color preferences persisted in localStorage (`sas-theme`, `sas-lang`, `sas-color-theme`)
- Settings page at `/settings` for theme, dark mode, and language switching
