# 🐳 Backend Dockerfile (Node.js + Express)
FROM node:18-alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --omit=dev

# Copy application code
COPY . .

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "src/server.js"]
