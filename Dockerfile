# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies needed for some packages
RUN apk add --no-cache libc6-compat

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Expose the development port
EXPOSE 3000

# Start the application in development mode
CMD ["pnpm", "dev"]
