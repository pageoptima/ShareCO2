# --------------------
# Stage 1: Builder
# --------------------
FROM node:18-alpine AS builder

# set working dir
WORKDIR /app

# copy package files first (cache friendliness)
COPY package.json package-lock.json* ./

# install all dependencies (including dev)
RUN npm ci

# copy source
COPY . .

# Build Next.js app
ENV NODE_ENV=production
RUN npm run build


# --------------------
# Stage 2: Runner
# --------------------
FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# copy package files and install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# copy next build output & public assets
COPY --from=builder /app/.next .next
COPY --from=builder /app/public public

# optionally copy prisma schema if you want it available in the image
COPY --from=builder /app/prisma prisma

# copy any other runtime config files your app needs
# e.g. next.config.js, .env.defaults (do NOT copy secrets)

EXPOSE 3000

# Run Prisma generate at runtime, then start Next.js
CMD [ "sh", "-c", "npx prisma generate && npm start" ]
