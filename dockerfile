# Use a Node.js Alpine-based image for the development stage
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image
COPY package*.json ./

# Install application dependencies using `pnpm install`
RUN pnpm install

# Copy the rest of the application code to the container
COPY . .

# Build the application (if needed)
RUN pnpm run build

# Define the command to start your application in development mode
ENTRYPOINT ["/bin/sh", "-c", "pnpm run start"]
