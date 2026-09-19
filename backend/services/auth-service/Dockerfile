FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/auth-service/package*.json ./services/auth-service/
COPY services/auth-service/tsconfig.json ./services/auth-service/
WORKDIR /app/services/auth-service
RUN npm install
COPY services/auth-service/src ./src
RUN npm run build
EXPOSE 5001
CMD ["npm", "start"]
