# --------------------
# Stage 1: Builder
# --------------------
FROM node:18 AS builder

WORKDIR /app

# Copy package files first (leverage Docker cache)
COPY package.json package-lock.json ./

# Install all deps (including dev for Next.js build)
RUN npm install

# Copy source code
COPY . .

# Build Next.js app
ENV NODE_ENV=production
RUN npm run build

# --------------------
# Stage 2: Runner
# --------------------
FROM node:18-alpine AS runner

WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install only production deps
RUN npm install --omit=dev

# Copy Next.js build and public assets
COPY --from=builder /app/.next .next
COPY --from=builder /app/public public

# Copy Prisma schema (needed for generate)
COPY --from=builder /app/prisma prisma

# Expose port (your ECS task maps this)
EXPOSE 3000

# Run Prisma generate at runtime (so ECS env vars are available), then start Next.js
CMD npx prisma generate && npm start