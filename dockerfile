# Base stage - common dependencies
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Build stage - for production
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
