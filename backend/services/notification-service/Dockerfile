FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/notification-service/package*.json ./services/notification-service/
COPY services/notification-service/tsconfig.json ./services/notification-service/
WORKDIR /app/services/notification-service
RUN npm install
COPY services/notification-service/src ./src
RUN npm run build
EXPOSE 5005
CMD ["npm", "start"]
