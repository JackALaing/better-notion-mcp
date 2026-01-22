FROM node:24-slim

WORKDIR /app

# Install pnpm and supergateway globally
RUN npm install -g pnpm supergateway

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

ENV PORT=8000

# Run via supergateway for HTTP transport
CMD ["supergateway", "--stdio", "node bin/cli.mjs", "--outputTransport", "streamableHttp", "--port", "8000", "--healthEndpoint", "/health"]
