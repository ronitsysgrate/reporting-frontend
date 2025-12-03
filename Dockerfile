# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the backend port
EXPOSE 8080

# Start the Express server
CMD ["npm", "start"]