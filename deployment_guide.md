# RFlow Deployment Guide

This guide will walk you through the process of deploying the RFlow application (Backend API + Angular Frontend) to production using cloud services.

## Part 1: Setting up the Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a new **M0 Free Cluster**.
3. Under **Database Access**, create a new database user (save the username and password).
4. Under **Network Access**, add `0.0.0.0/0` to allow access from anywhere (or limit it to your backend's IP later).
5. Click **Connect** on your cluster, select "Connect your application", and copy the connection string. It will look like:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/rflow?retryWrites=true&w=majority`
6. Replace `<username>` and `<password>` with the credentials you created. Keep this string handy.

## Part 2: Deploying the Backend
Since you have a microservices architecture managed via Docker Compose, you have two great options:

### Option A: Railway (Easiest, automated via GitHub)
1. Sign up for [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your RFlow repository.
4. Railway will automatically detect the `docker-compose.yml`. You should configure it to use `backend/docker-compose.prod.yml` as the start configuration if possible, or define environment variables.
5. Go to the project settings in Railway and add your Environment Variables:
   - `MONGO_URI`: `[Your MongoDB Atlas Connection String]`
   - `JWT_SECRET`: `[A strong random string]`
6. Once deployed, Railway will give you a public URL for your gateway service (e.g., `https://rflow-gateway-production.up.railway.app`).

### Option B: VPS (DigitalOcean / AWS EC2)
1. Spin up an Ubuntu server on your cloud provider of choice.
2. SSH into your server and install Docker and Docker Compose.
3. Clone your GitHub repository:
   ```bash
   git clone https://github.com/yourusername/rflow.git
   cd rflow/backend
   ```
4. Create a `.env` file in the `backend` directory:
   ```bash
   echo "MONGO_URI=[Your MongoDB Atlas Connection String]" >> .env
   echo "JWT_SECRET=[A strong random string]" >> .env
   ```
5. Run the production docker-compose file:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
6. Note the public IP or domain of your VPS. This is your API URL.

## Part 3: Deploying the Frontend (Vercel)
1. Open `frontend/src/environments/environment.prod.ts` in your local code editor.
2. Update the `apiUrl` to be the URL of your live Gateway Service (from Part 2).
3. Commit and push this change to your GitHub repository.
4. Sign up for [Vercel](https://vercel.com/) and click **Add New Project**.
5. Import your RFlow GitHub repository.
6. In the configuration settings:
   - **Framework Preset:** Angular
   - **Root Directory:** `frontend`
7. Click **Deploy**. Vercel will automatically build the frontend using `environment.prod.ts` and give you a live URL where your users can access the application!
