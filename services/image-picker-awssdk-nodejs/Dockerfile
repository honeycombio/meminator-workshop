# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY tsconfig.json .
COPY ./src ./src

RUN npm run build

# Expose the port that your app runs on
EXPOSE 10118

# Command to run your application
CMD ["npm", "start"]
