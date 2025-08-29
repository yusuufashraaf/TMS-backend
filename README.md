# Task Management System (TMS) Backend

## 🌟 Overview

This is a **Task Management System (TMS)** backend built with **Node.js, Express, and MongoDB**.  
It provides secure authentication, project and task management, PDF report generation, and real-time updates via **Socket.IO**.

---

## 🚀 Core Features

| Module                 | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| 👤 **User Management** | Signup, login, role-based access (Admin/User).                      |
| 📚 **Projects**        | Create, update, and manage projects with members.                   |
| ✅ **Tasks**           | Task CRUD, status updates, deadlines, and assignments.              |
| 📊 **Dashboard**       | Task statistics and user-specific views.                            |
| 🔐 **Security**        | JWT authentication, bcrypt password hashing, role-based middleware. |
| 📄 **PDF Reports**     | Generate project PDF reports (Admin only).                          |
| ⚡ **Real-time**       | Online user tracking with Socket.IO.                                |

---

## 🧱 Technology Stack

| Category                | Technology                     |
| ----------------------- | ------------------------------ |
| Backend Framework       | Express.js                     |
| Database                | MongoDB + Mongoose             |
| Authentication          | JWT + bcrypt                   |
| Real-time Communication | Socket.IO                      |
| PDF Generation          | pdfkit / reportlab (Node side) |

---

## 📁 Project Structure

```bash
src/
├── app.js                # Express app configuration
├── server.js             # Server entry point
│
├── config/               # Configuration files
│   ├── db.js             # Database connection
│   └── .gitkeep
│
├── controllers/          # Request handlers (business logic)
│   ├── authController.js
│   ├── pdfController.js
│   ├── projectController.js
│   ├── taskController.js
│   ├── userController.js
│   └── .gitkeep
│
├── middlewares/          # Custom middleware functions
│   ├── authorizationMiddleware.js
│   └── .gitkeep
│
├── models/               # Mongoose models
│   ├── Project.js
│   ├── Task.js
│   ├── User.js
│   └── .gitkeep
│
├── routes/               # Route definitions
│   ├── authRoutes.js
│   ├── pdfRoutes.js
│   ├── projectRoutes.js
│   ├── taskRoutes.js
│   ├── userRoutes.js
│   └── .gitkeep
│
└── utils/                # Helper utilities
    └── .gitkeep
```

---

## 🛠️ Setup & Installation

### System Requirements

| Tool    | Version |
| ------- | ------- |
| Node.js | 18+     |
| MongoDB | 6+      |

### Installation Steps

```bash
git clone git@github.com:yusuufashraaf/TMS-backend.git
cd TMS-backend
npm install
```

### Environment Configuration

Create `.env` file in root:

```env
PORT=8000
DATABASE=mongodb+srv://<username>:<db_password>@cluster.mongodb.net/tms
DATABASE_PASSWORD=yourpassword
JWT_SECRET=yourjwtsecret
JWT_EXPIRES_IN=3600
```

---

## 🔐 Security Features

| Feature            | Description                               |
| ------------------ | ----------------------------------------- |
| JWT Authentication | Secure user session with token validation |
| Password Hashing   | Bcrypt for secure password storage        |
| Role-based Access  | Restrict routes to Admin/User             |
| Input Validation   | Mongoose schema validation                |
| Secure Socket.IO   | Tracks authenticated online users         |

---

## 📊 API Endpoints

### Auth Routes

- `POST /api/v1/auth/signup` → Register new user
- `POST /api/v1/auth/login` → Login user

### User Routes

- `GET /api/v1/users` → Get all users (Admin only)

### Project Routes

- `POST /api/v1/projects` → Create project (Admin only)
- `GET /api/v1/projects` → Get all projects

### Task Routes

- `GET /api/v1/tasks/dashboard-stats` → Get dashboard stats
- `GET /api/v1/tasks/my-tasks` → Get logged-in user tasks
- `PATCH /api/v1/tasks/:id/status` → Update task status
- `POST /api/v1/tasks` → Create task (Admin only)

### PDF Routes

- `GET /api/v1/pdf/:projectId` → Generate project report (Admin only)

---

## 🌍 Run Locally

```bash
npm run dev
```

Server runs at: [http://localhost:8000](http://localhost:8000)

---

## 📩 Support & Contact

| Method        | Link                                                                 |
| ------------- | -------------------------------------------------------------------- |
| Email         | yusuufashraaf@icloud.com                                             |
| GitHub Issues | [GitHub Issues](https://github.com/yusuufashraaf/TMS-backend/issues) |

---

## 📄 License

Licensed under the **MIT License**. Free to use, modify, and distribute under the license terms.
