FROM supercorp/supergateway:latest

ENV PORT=8000

CMD ["--stdio", "npx -y @n24q02m/better-notion-mcp@latest", "--outputTransport", "streamableHttp", "--port", "8000", "--healthEndpoint", "/health"]
