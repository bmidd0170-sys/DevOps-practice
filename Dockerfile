# Stage 1: Dependencies
FROM node:25-alpine3.22 AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate


# Stage 2: Builder
FROM node:25-alpine3.22 AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
RUN npm run build


# Stage 3: Runner (Production)
FROM node:25-alpine3.22 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Install only production dependencies and Prisma CLI
RUN npm ci --only=production && \
    npm install prisma --save-dev && \
    npx prisma generate

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run Prisma migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]