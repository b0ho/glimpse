# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production
RUN cp -R node_modules prod_node_modules
RUN npm ci

# Copy prisma files
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install production dependencies
RUN apk add --no-cache openssl

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prod_node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Create uploads directory
RUN mkdir -p /app/uploads

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]