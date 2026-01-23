/**
 * Better Notion MCP Server
 * Using composite tools for human-friendly AI agent interactions
 */

import express from 'express'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { registerTools } from './tools/registry.js'

export async function initServer() {
  // Get Notion token from environment
  const notionToken = process.env.NOTION_TOKEN

  if (!notionToken) {
    console.error('NOTION_TOKEN environment variable is required')
    console.error('Get your token from https://www.notion.so/my-integrations')
    process.exit(1)
  }

  const PORT = process.env.PORT || 8000

  // Create MCP server
  const server = new Server(
    {
      name: '@n24q02m/better-notion-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: { listChanged: true },
        resources: {}
      }
    }
  )

  // Register composite tools
  registerTools(server, notionToken)

  // Create Express app
  const app = express()
  app.use(express.json())

  // Health endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  // MCP endpoint
  app.post('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  })

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`Better Notion MCP server running on port ${PORT}`)
  })

  return server
}
