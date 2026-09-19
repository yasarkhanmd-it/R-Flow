# RFlow Application

This is the RFlow application, a microservices-based project management system.

## Setup Instructions for Local Development and Testing

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** running locally on default port (`mongodb://localhost:27017`)

### 2. Install Dependencies
You need to install dependencies for both the backend (and its microservices) and the frontend.

#### Backend
```bash
cd backend
npm install

# Install microservices dependencies
cd services/gateway-service && npm install
cd ../auth-service && npm install
cd ../project-service && npm install
cd ../story-service && npm install
cd ../task-service && npm install
cd ../notification-service && npm install
cd ../dashboard-service && npm install
cd ../report-service && npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Database Seeding (Demo Data)
To quickly test the application, you can seed the database with demo users, projects, departments, stories, and tasks.

```bash
cd backend
npx ts-node seed_all.ts
```

### 4. Running the Application

**Start the Backend Services:**
```bash
cd backend
npm run services
```

**Start the Frontend:**
```bash
cd frontend
npm start
```

### 5. Test Credentials
Once the frontend and backend are running, you can log in with the following demo credentials created by the seed script:

- **Admin User:** admin@rflow.com / Password123
- **Manager User:** manager@rflow.com / Password123
- **Developer User:** dev@rflow.com / Password123

## Git Branch Structure
- `main`: The stable core repository.
- `demo-users`: A specialized branch to view user-like features and mock testing scenarios.
