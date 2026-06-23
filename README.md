# Система за записване на консултации

Teacher-student consultation booking system built as a Bulgarian high school final project.

This project uses a multilayer architecture with Next.js, Prisma ORM, and a relational database.

---

## Project Purpose

Teachers register an account, set up their available consultation slots, and receive a personal QR code. Students scan the QR code and book a slot — no account required. Teachers manage all bookings from their dashboard.

---

## Technologies Used

| Layer | Technology |
|---|---|
| Frontend | React 19, Next.js 16 App Router, Tailwind CSS 4 |
| Backend | Next.js Route Handlers (REST API) |
| ORM | Prisma 7 with libSQL adapter |
| Database | SQLite (via `@libsql/client`) |
| Auth | Custom HMAC-SHA256 session cookies (`bcryptjs`) |
| Validation | Zod 4 |
| QR codes | `qrcode` npm package |
| Tests | Vitest 4 |
| Language | TypeScript (strict mode) |

---

## Architecture

The project is divided into five layers:

```
┌──────────────────────────────────┐
│  Presentation Layer              │  React pages and components (Next.js App Router)
├──────────────────────────────────┤
│  API Layer                       │  Next.js Route Handlers under /api/*
├──────────────────────────────────┤
│  Service Layer                   │  Business logic — validation, overlap checks, QR slugs
├──────────────────────────────────┤
│  Repository Layer                │  Database access functions (one file per model)
├──────────────────────────────────┤
│  Database Layer                  │  SQLite via Prisma ORM and libSQL adapter
└──────────────────────────────────┘
```

### Key files

```
src/
  app/                          # Next.js pages and API routes
    (auth)/login|register/      # Login and registration pages
    api/
      auth/login|logout/        # Auth endpoints
      availability/             # CRUD for ConsultationAvailability
      bookings/                 # CRUD for Booking
      teachers/                 # Teacher profile endpoints
      book/[teacherQrCode]/     # Public booking endpoint (no auth)
    dashboard/                  # Teacher dashboard UI
    book/[teacherQrCode]/       # Public booking page (no auth)
  server/
    repositories/               # Direct Prisma queries
    services/                   # Business logic
  lib/
    auth.ts                     # bcrypt helpers
    session.ts                  # HMAC session cookie read/write
    errors.ts                   # NotFoundError, ConflictError, AuthError, ValidationError
    prisma.ts                   # Prisma client singleton
    validation.ts               # Zod schemas
  __tests__/
    availability.test.ts        # CRUD tests for ConsultationAvailability
prisma/
  schema.prisma                 # Data model
```

---

## Database Models

### Teacher
| Field | Type | Notes |
|---|---|---|
| `id` | String | CUID, primary key |
| `fullName` | String | Required |
| `email` | String | Required, unique |
| `passwordHash` | String | bcrypt hash, never exposed |
| `subject` | String | Required |
| `qrCodeSlug` | String | Required, unique — used in QR URL |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

### ConsultationAvailability
| Field | Type | Notes |
|---|---|---|
| `id` | String | CUID, primary key |
| `teacherId` | String | Foreign key → Teacher |
| `date` | DateTime | Specific calendar date |
| `startTime` | String | HH:MM format |
| `endTime` | String | HH:MM format |
| `room` | String | Required |
| `isActive` | Boolean | Default true |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

### Booking
| Field | Type | Notes |
|---|---|---|
| `id` | String | CUID, primary key |
| `teacherId` | String | Foreign key → Teacher |
| `availabilityId` | String | Foreign key → ConsultationAvailability |
| `studentName` | String | Required |
| `studentClass` | String | Required |
| `studentEmail` | String | Required |
| `status` | BookingStatus | CONFIRMED / CANCELLED / COMPLETED |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

---

## CRUD Operations Implemented

### ConsultationAvailability (full CRUD)
| Operation | Route | Description |
|---|---|---|
| Create | `POST /api/availability` | Create one or more weekly-repeating slots |
| Read (list) | `GET /api/availability` | List all slots for the logged-in teacher |
| Read (single) | `GET /api/availability/[id]` | Get one slot by id |
| Update | `PATCH /api/availability/[id]` | Update date, time, room, or isActive |
| Delete | `DELETE /api/availability/[id]` | Delete a slot |

### Teacher (full CRUD)
| Operation | Route | Description |
|---|---|---|
| Create | `POST /api/teachers` | Register a new teacher account |
| Read | `GET /api/teachers/[id]` | Get teacher profile |
| Update | `PATCH /api/teachers/[id]` | Update fullName or subject |
| Delete | `DELETE /api/teachers/[id]` | Delete account |

### Booking (Create + Read + status Update + Delete)
| Operation | Route | Description |
|---|---|---|
| Create | `POST /api/book/[teacherQrCode]` | Student books a slot (no auth) |
| Read | `GET /api/bookings` | List teacher's bookings |
| Update | `PATCH /api/bookings/[id]` | Change status (CONFIRMED/CANCELLED/COMPLETED) |
| Delete | `DELETE /api/bookings/[id]` | Teacher removes a booking |

---

## Authentication

Teachers authenticate with email and password. Passwords are hashed with `bcryptjs` (12 salt rounds). On login, the server creates an HMAC-SHA256 signed session token (Base64URL encoded JSON + signature) and stores it in an HTTP-only cookie (`session`, 7-day TTL). The `SESSION_SECRET` environment variable is required.

Students do **not** have accounts. The public booking page is accessible to anyone with the teacher's QR link.

The auth cookie is verified in `src/proxy.ts` (Next.js 16's replacement for `middleware.ts`). Protected routes redirect to `/login` if the session is missing or expired.

---

## QR Code Booking Flow

1. Teacher registers → system generates a unique `qrCodeSlug` (random hex string).
2. Teacher dashboard shows a QR code image and a copyable URL: `http://localhost:3000/book/{qrCodeSlug}`.
3. Student scans QR code or visits the URL.
4. The public page `/book/[teacherQrCode]` displays teacher info and all active future slots with current booking counts.
5. Student selects a slot, fills in name, class, and email, and submits.
6. Server validates input and creates a `Booking` record (status: CONFIRMED).
7. Teacher sees the new booking in the dashboard.

---

## How to Run the Project

### Prerequisites
- Node.js 20+
- npm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env   # or create manually:
echo 'DATABASE_URL="file:./dev.db"' > .env
echo 'SESSION_SECRET="change-this-to-a-long-random-string"' >> .env

# 3. Push database schema
npx prisma db push

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Run Prisma Migrations

This project uses `prisma db push` for development (schema sync without migration files). For production use or to track migration history:

```bash
# Sync schema to database (development)
npx prisma db push

# Create and apply a named migration
npx prisma migrate dev --name <migration-name>

# Check migration status
npx prisma migrate status

# Open Prisma Studio (visual database browser)
npx prisma studio
```

---

## How to Run Tests

Tests cover CRUD operations for `ConsultationAvailability` using a separate test database (`test.db`) so development data is never touched.

```bash
npm test
```

The `pretest` script automatically resets and re-initializes `test.db` before each run. Tests are in `src/__tests__/availability.test.ts`.

---

## Demo Flow

1. Open [http://localhost:3000](http://localhost:3000) → redirected to login.
2. Click **Register**, fill in name, email, password, subject.
3. You are logged in and see the dashboard with your QR code.
4. Go to **Availability** → create a consultation slot (choose date, start/end time, room).
5. Copy the booking URL from the dashboard or scan the QR code.
6. Open the booking URL in a new tab (no login needed).
7. Select a slot, fill in student name, class, and email, click **Book**.
8. Return to the teacher dashboard → **Bookings** → see the new booking.
9. Mark the booking as COMPLETED or delete it.

---

## Mapping to Bulgarian School Requirements

| Изискване | Изпълнение |
|---|---|
| Многослойно приложение | Приложението е разделено на presentation layer, API layer, service layer, repository layer и database layer. |
| Използване на ORM технология | Използва се Prisma ORM. |
| Поне 3 таблици | Teacher, ConsultationAvailability, Booking. |
| Поне 5 задължителни полета във всяка таблица | Всяка таблица има минимум 5 required полета (вижте секцията Database Models). |
| CRUD операции на поне 2 обекта | CRUD операции са реализирани за Teacher и ConsultationAvailability. Booking има Create, Read, Update (статус), Delete. |
| Презентационен слой | Реализиран е графичен потребителски интерфейс с React и Next.js. |
| Тестов код за CRUD операции | Реализирани са Vitest тестове за CRUD операциите на ConsultationAvailability (5 теста: create, read by id, read list, update, delete + проверка за изтриване). |

---

**Изискване: многослойно приложение**
Изпълнение: приложението е разделено на presentation layer, API layer, service layer, repository layer и database layer.

**Изискване: използване на ORM технология**
Изпълнение: използва се Prisma ORM.

**Изискване: поне 3 таблици**
Изпълнение: Teacher, ConsultationAvailability, Booking.

**Изискване: поне 5 задължителни полета във всяка таблица**
Изпълнение: всяка таблица има минимум 5 required полета.

**Изискване: CRUD операции на поне 2 обекта**
Изпълнение: CRUD операции са реализирани за Teacher и ConsultationAvailability.

**Изискване: презентационен слой**
Изпълнение: реализиран е графичен потребителски интерфейс с React и Next.js.

**Изискване: тестов код за CRUD операции**
Изпълнение: реализирани са Vitest тестове за CRUD операциите на ConsultationAvailability.
