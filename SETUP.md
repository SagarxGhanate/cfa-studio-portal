# CFA Studio — Setup & Deployment Guide

Complete guide to get CFA Studio Admin Portal running locally and deployed to production.

---

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

---

## 1. Supabase Setup (Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** → name it (e.g., `cfa-studio`)
3. Set a strong database password — **save this**
4. Wait for the project to finish provisioning
5. Go to **Settings → Database → Connection string → URI**
6. Copy the connection string. It looks like:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
7. Replace `[password]` with your database password

---

## 2. Google OAuth Setup (Optional)

If you want Google Sign-In:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Add authorized origins:
   - `http://localhost:5173` (dev)
   - Your production domain
7. Copy the **Client ID**

---

## 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
PORT=5000
```

> **Generate a JWT secret:** Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in terminal.

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed admin user (optional — creates default admin)
node prisma/seed.js

# Start backend
npm run dev
```

Backend runs on `http://localhost:5000`.

---

## 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file (if not exists)
echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "VITE_GOOGLE_CLIENT_ID=your-google-client-id" >> .env

# Start frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## 5. First Login

1. Open `http://localhost:5173` in your browser
2. Register a new admin account, or
3. Login with the seeded admin credentials (check `prisma/seed.js`)

---

## Production Deployment

### Backend → Railway / Render

1. Push backend to a GitHub repo
2. Connect to [Railway](https://railway.app) or [Render](https://render.com)
3. Set environment variables (DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID)
4. Set start command: `npm start`
5. Note the deployed URL (e.g., `https://cfa-api.up.railway.app`)

### Frontend → Vercel

1. Push frontend to a GitHub repo
2. Connect to [Vercel](https://vercel.com)
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Set environment variables:
   - `VITE_API_URL` = your backend URL + `/api`
   - `VITE_GOOGLE_CLIENT_ID` = your Google Client ID

### Post-Deployment

- Update CORS origins in `backend/src/index.js` to include your production domain
- Update Google OAuth authorized origins in Google Cloud Console
- Run `npx prisma db push` if you haven't migrated the production database

---

## Customization

### Rebranding

- **Colors:** Edit `frontend/tailwind.config.js` → `colors` section
- **App Name:** Search and replace "CFA Studio" across frontend files
- **Logo:** Replace references in `Navbar.jsx` and `Login.jsx`
- **PDF Header:** Edit `Analytics.jsx` → `exportAnalyticsPDF()` function

### Adding Fields

1. Edit `backend/prisma/schema.prisma` — add new field
2. Run `npx prisma db push`
3. Update the member controller and routes
4. Update the frontend form (`AddMember.jsx`)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Can't reach database server` | Check DATABASE_URL in .env |
| `CORS error` | Add your frontend URL to CORS whitelist in `index.js` |
| `Google login fails` | Verify Client ID and authorized origins |
| `Prisma client not found` | Run `npx prisma generate` |
| `Port already in use` | Change PORT in .env or kill the existing process |
