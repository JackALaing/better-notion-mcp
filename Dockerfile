FROM node:24-slim

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

ENV PORT=8000

# Run directly with native HTTP transport
CMD ["node", "bin/cli.mjs"]
