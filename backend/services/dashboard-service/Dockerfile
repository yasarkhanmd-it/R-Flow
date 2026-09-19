FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/dashboard-service/package*.json ./services/dashboard-service/
COPY services/dashboard-service/tsconfig.json ./services/dashboard-service/
WORKDIR /app/services/dashboard-service
RUN npm install
COPY services/dashboard-service/src ./src
RUN npm run build
EXPOSE 5006
CMD ["npm", "start"]
