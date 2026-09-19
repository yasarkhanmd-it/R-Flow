FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/gateway-service/package*.json ./services/gateway-service/
COPY services/gateway-service/tsconfig.json ./services/gateway-service/
WORKDIR /app/services/gateway-service
RUN npm install
COPY services/gateway-service/src ./src
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
