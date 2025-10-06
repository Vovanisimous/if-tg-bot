############################################
# Builder stage: install dev deps and build #
############################################
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (including dev) using lockfile for reproducibility
COPY package*.json ./
RUN npm ci

# Copy the rest of the project
COPY . .

# Build TypeScript (postbuild in package.json may also copy assets to dist)
RUN npm run build

############################################
# Runner stage: small image with prod deps  #
############################################
FROM node:18-alpine AS runner

WORKDIR /app

# Only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Copy raw assets to project root so runtime paths like ../../assets work
COPY --from=builder /app/assets ./assets

# Expose port for health endpoint (optional for polling)
EXPOSE 3000

# Start the bot
CMD ["node", "dist/bot.js"]
