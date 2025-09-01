# --------------------
# Stage 1: Builder
# --------------------
FROM node:18 AS builder

WORKDIR /app

# Copy package files first (for caching)
COPY package.json package-lock.json ./

# Install dependencies (all, including dev)
RUN npm install

# Copy all source code
COPY . .

# Copy environment file for build
COPY .env .env

# Set NODE_ENV to production for Next.js build
ENV NODE_ENV=production

# Build Next.js app
RUN npm run build

# --------------------
# Stage 2: Runner
# --------------------
FROM node:18-alpine AS runner

WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy build output & public assets
COPY --from=builder /app/.next .next
COPY --from=builder /app/public public

# Copy prisma schema
COPY --from=builder /app/prisma prisma

# Generate Prisma client inside container
RUN npx prisma generate

# Expose Next.js port
EXPOSE 3000

CMD ["npm", "start"]