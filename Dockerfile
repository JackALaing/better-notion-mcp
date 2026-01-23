FROM node:24-slim
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

ENV PORT=8000

# Run directly with native HTTP transport
CMD ["node", "bin/cli.mjs"]
