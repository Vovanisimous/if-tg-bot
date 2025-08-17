# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Copy assets to dist folder
RUN cp -r assets dist/

# Set working directory to dist
WORKDIR /app/dist

# Expose port (if needed for webhooks)
EXPOSE 3000

# Start the bot
CMD ["node", "bot.js"]
