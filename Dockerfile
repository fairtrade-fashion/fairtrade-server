# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Prisma Client separately to avoid potential caching issues
RUN npx prisma generate

# Copy the rest of the application files to the working directory
COPY . .

# Expose the application port (this should match the port used in your NestJS app)
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start:prod"]
