# 🐳 Bharosa Frontend Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Accept build arguments
ARG NODE_ENV=production
ARG REACT_APP_API_URL
ARG REACT_APP_ENVIRONMENT=production

# Set environment variables for build
ENV NODE_ENV=${NODE_ENV}
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}
ENV GENERATE_SOURCEMAP=false

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \  
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
