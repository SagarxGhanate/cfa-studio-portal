<div align="center">
  
  # 🏢 Calisthenics for All (CFA) | Admin Portal & Database
  
  **A full-stack, enterprise-grade member management and analytics platform.**
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)]()
  [![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)]()
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)]()
</div>

<br />

## 📖 Overview

The **CFA Admin Portal** was custom-built for *Calisthenics for All* to digitalize and streamline their internal operations. Moving away from manual spreadsheets, this platform provides administrators with a highly secure, centralized database to track hundreds of athletes, manage class schedules, and analyze business growth metrics in real-time.

Built as a modern monorepo, it features a React-based frontend dashboard and a robust Node.js/Express backend powered by the Prisma ORM.

## 💻 Tech Stack

- **Frontend:** React.js, Tailwind CSS (for premium UI/UX), Zustand (State Management)
- **Backend:** Node.js, Express.js (REST API)
- **Database & ORM:** SQL (via Prisma ORM for type-safe database queries)
- **Data Processing:** SheetJS / Excel parser for bulk data handling

## ✨ Key Features & Engineering

- **📊 Advanced Analytics Dashboard:** Real-time data visualization showing member growth, active vs. inactive status, and location-based demographics. Includes one-click PDF and Excel reporting.
- **📥 Bulk Excel Operations:** Engineered a robust data-pipeline allowing admins to drag-and-drop massive Excel spreadsheets to instantly seed the database, bypassing manual data entry.
- **👥 Dynamic Member Management:** Advanced filtering capabilities (by Society, Class Type, Location, and Status). Includes conditional logic to handle minor/toddler registrations by requiring Guardian Details.
- **🔐 Secure Role-based Access:** Custom JWT authentication middleware ensuring that sensitive member data is strictly isolated to authorized administrative personnel.
- **🌓 Adaptive Interface:** A highly polished, responsive design featuring a custom Light/Dark mode toggle engineered for accessibility and low eye strain during long administrative sessions.

## 🏗️ Project Structure

This project is structured as a monorepo containing both the client and server codebases:

```text
CFA Database/
├── frontend/       # React UI, Tailwind styles, and Dashboard components
└── backend/        # Express server, Prisma schemas, and Auth controllers
