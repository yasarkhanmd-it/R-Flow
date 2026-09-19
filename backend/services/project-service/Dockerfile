FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/project-service/package*.json ./services/project-service/
COPY services/project-service/tsconfig.json ./services/project-service/
WORKDIR /app/services/project-service
RUN npm install
COPY services/project-service/src ./src
RUN npm run build
EXPOSE 5002
CMD ["npm", "start"]
