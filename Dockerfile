FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm run build

# Install supergateway globally
RUN npm install -g supergateway

ENV PORT=8000

# Run via supergateway
CMD ["supergateway", "--stdio", "node dist/index.js", "--outputTransport", "streamableHttp", "--port", "8000", "--healthEndpoint", "/health"]
