FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/report-service/package*.json ./services/report-service/
COPY services/report-service/tsconfig.json ./services/report-service/
WORKDIR /app/services/report-service
RUN npm install
COPY services/report-service/src ./src
RUN npm run build
EXPOSE 5007
CMD ["npm", "start"]
