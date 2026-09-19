FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/story-service/package*.json ./services/story-service/
COPY services/story-service/tsconfig.json ./services/story-service/
WORKDIR /app/services/story-service
RUN npm install
COPY services/story-service/src ./src
RUN npm run build
EXPOSE 5003
CMD ["npm", "start"]
