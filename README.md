<div align="center">
  
  # 🏢 CFA Studio | Admin Portal & Database
  
  **A full-stack, production-ready member management and analytics platform for fitness studios.**
  
  [![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)]()
  [![Prisma](https://img.shields.io/badge/Prisma_5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)]()
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)]()
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)]()
</div>

<br />

## 📖 Overview

**CFA Studio Admin Portal** is a premium member management system built for fitness and calisthenics studios. It replaces manual spreadsheets with a centralized, secure database featuring real-time analytics, bulk data import, and branded report exports.

Built as a modern monorepo with a React SPA frontend and Node.js/Express REST API backend, powered by Prisma ORM on Supabase PostgreSQL.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[SETUP.md](./SETUP.md)** | Step-by-step deployment guide (local + production) |
| **[API.md](./API.md)** | Complete REST API documentation with examples |

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------| 
| **Frontend** | React 19, Vite 8, Tailwind CSS 3, Zustand, Recharts, React Hook Form |
| **Backend** | Node.js, Express 5, JWT Authentication, Google OAuth 2.0 |
| **Database** | Supabase PostgreSQL via Prisma 5 ORM |
| **Security** | Helmet, CORS, express-rate-limit, bcrypt |
| **Exports** | SheetJS (Excel), jsPDF (PDF reports) |
| **Testing** | Jest + Supertest (23 API tests) |

## ✨ Features

### Core
- **👥 Member Management** — Full CRUD with search, multi-filter, pagination, and batch selection
- **📸 Member Photos** — Avatar upload stored as original-quality base64 in database
- **📊 Analytics Dashboard** — 6 time periods (W/M/Q/6M/1Y/All), bar charts, pie charts, location heatmap
- **📥 Excel Import** — Drag-and-drop bulk import with smart column mapping, data preview, and photo support
- **📄 PDF & Excel Reports** — One-click branded analytics reports and member exports (including avatars)
- **🔍 Member Detail** — Premium profile view with photo lightbox, status glow, and action cards
- **📱 Drill-Down Navigation** — Click Dashboard stats to drill into filtered member views

### Security
- **🔐 JWT Authentication** — Email/password + Google OAuth login
- **🛡️ Multi-tenant Isolation** — Each admin sees only their own data
- **⚡ Rate Limiting** — 10 login attempts per 15 minutes
- **🔒 Security Headers** — Helmet + CORS whitelist

### UI/UX
- **🌓 Light/Dark Mode** — Smooth theme toggle with full coverage
- **📱 Responsive Design** — Desktop table + mobile bottom nav
- **✨ Premium Polish** — Skeleton loading, success overlays, micro-interactions
- **🎯 Drag & Drop** — File upload zones with visual feedback
- **🚫 Error Boundary** — Graceful crash handling with recovery options
- **🔗 Dynamic Titles** — Browser tab updates per page
- **404 Page** — Branded not-found page with navigation

## 🏗️ Project Structure

```text
CFA Database/
├── frontend/           # React SPA
│   ├── public/         # Static assets (favicon)
│   ├── src/
│   │   ├── pages/      # Dashboard, Members, Analytics, Login, MemberDetail, NotFound, etc.
│   │   ├── components/ # Navbar, BottomNav, Toast, Filters, ErrorBoundary
│   │   ├── hooks/      # useChartData (shared analytics logic)
│   │   ├── store/      # Zustand auth & theme stores
│   │   └── services/   # Axios API client with interceptors
│   └── tailwind.config.js
├── backend/            # Express REST API
│   ├── src/
│   │   ├── controllers/  # Auth & Member business logic
│   │   ├── routes/       # Express route definitions
│   │   ├── middleware/   # JWT auth middleware
│   │   └── __tests__/    # Jest + Supertest API tests (23 tests)
│   └── prisma/
│       ├── schema.prisma # Database schema
│       └── seed.js       # Admin seeder
├── SETUP.md            # Deployment guide
└── API.md              # REST API documentation
```

## 🚀 Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env    # Configure DATABASE_URL, DIRECT_URL, JWT_SECRET
npx prisma db push
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

> See [SETUP.md](./SETUP.md) for detailed setup including Supabase and Google OAuth configuration.

## 🧪 Testing

```bash
cd backend
npm test    # Runs 23 API tests (auth + members)
```

## 📜 License

This project is proprietary software. All rights reserved.
