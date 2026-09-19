FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/task-service/package*.json ./services/task-service/
COPY services/task-service/tsconfig.json ./services/task-service/
WORKDIR /app/services/task-service
RUN npm install
COPY services/task-service/src ./src
RUN npm run build
EXPOSE 5004
CMD ["npm", "start"]
