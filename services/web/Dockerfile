# Use Node.js image as build environment
FROM node:latest AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY src ./src
COPY static ./static

# Set environment variable during build
ARG HONEYCOMB_API_KEY=value
ENV HONEYCOMB_API_KEY=$HONEYCOMB_API_KEY

# Build the application
RUN ls  
RUN npm run build

# Stage 2: Serve the built files using Nginx
FROM nginx:alpine

# Copy the built files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration file to the container
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 10117
EXPOSE 10117

# Command to start nginx when container runs
CMD ["nginx", "-g", "daemon off;"]
