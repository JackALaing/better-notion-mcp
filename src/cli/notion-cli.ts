#!/usr/bin/env node
/**
 * Standalone Notion CLI
 * Bypasses MCP protocol, calls composite tools directly
 */

import { Client } from '@notionhq/client'

// Import composite tools directly (not through registry to avoid MCP imports)
import { pages } from '../tools/composite/pages.js'
import { databases } from '../tools/composite/databases.js'
import { blocks } from '../tools/composite/blocks.js'
import { users } from '../tools/composite/users.js'
import { workspace } from '../tools/composite/workspace.js'
import { commentsManage } from '../tools/composite/comments.js'
import { contentConvert } from '../tools/composite/content.js'
import { NotionMCPError, aiReadableMessage } from '../tools/helpers/errors.js'
import { DOCS } from './docs.js'

const TOOL_NAMES = [
  'pages',
  'databases',
  'blocks',
  'users',
  'workspace',
  'comments',
  'content_convert',
] as const

type ToolName = (typeof TOOL_NAMES)[number]

function output(data: unknown, isError = false): void {
  const result = isError ? { ...data as object, isError: true } : data
  console.log(JSON.stringify(result, null, 2))
}

function showUsage(): void {
  output({
    usage: "notion-cli <tool> '<json-args>' | notion-cli help <tool>",
    tools: [...TOOL_NAMES],
    examples: [
      "notion-cli pages '{\"action\":\"get\",\"page_id\":\"abc123\"}'",
      "notion-cli workspace '{\"action\":\"search\",\"query\":\"meeting\"}'",
      'notion-cli help pages',
    ],
  })
}

async function runTool(
  toolName: ToolName,
  args: unknown,
  notion?: Client
): Promise<unknown> {
  switch (toolName) {
    case 'pages':
      return await pages(notion!, args as any)
    case 'databases':
      return await databases(notion!, args as any)
    case 'blocks':
      return await blocks(notion!, args as any)
    case 'users':
      return await users(notion!, args as any)
    case 'workspace':
      return await workspace(notion!, args as any)
    case 'comments':
      return await commentsManage(notion!, args as any)
    case 'content_convert':
      // content_convert doesn't need Notion client
      return await contentConvert(args as any)
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    showUsage()
    process.exit(0)
  }

  const command = args[0]

  // Handle: notion-cli help [tool]
  if (command === 'help') {
    const toolName = args[1]
    if (!toolName) {
      output({
        usage: 'notion-cli help <tool>',
        tools: [...TOOL_NAMES],
      })
      process.exit(0)
    }
    const doc = DOCS[toolName]
    if (!doc) {
      output({ error: `Unknown tool: ${toolName}`, available: [...TOOL_NAMES] }, true)
      process.exit(1)
    }
    output({ tool: toolName, documentation: doc })
    process.exit(0)
  }

  // Validate tool name
  if (!TOOL_NAMES.includes(command as ToolName)) {
    output({ error: `Unknown tool: ${command}`, available: [...TOOL_NAMES] }, true)
    process.exit(1)
  }

  const toolName = command as ToolName

  // Parse JSON arguments
  const jsonArg = args[1]
  if (!jsonArg) {
    output(
      { error: 'JSON arguments required', usage: `notion-cli ${toolName} '<json>'` },
      true
    )
    process.exit(1)
  }

  let parsedArgs: unknown
  try {
    parsedArgs = JSON.parse(jsonArg)
  } catch (e) {
    output(
      { error: 'Invalid JSON arguments', detail: (e as Error).message },
      true
    )
    process.exit(1)
  }

  // Initialize Notion client (skip for content_convert)
  let notion: Client | undefined
  if (toolName !== 'content_convert') {
    const token = process.env.NOTION_TOKEN
    if (!token) {
      output(
        {
          error: 'NOTION_TOKEN environment variable is required',
          suggestion:
            'Set NOTION_TOKEN with your integration token from https://www.notion.so/my-integrations',
        },
        true
      )
      process.exit(1)
    }
    notion = new Client({ auth: token, notionVersion: '2025-09-03' })
  }

  try {
    const result = await runTool(toolName, parsedArgs, notion)
    output(result)
    process.exit(0)
  } catch (error) {
    const enhancedError =
      error instanceof NotionMCPError
        ? error
        : new NotionMCPError(
            (error as Error).message,
            'TOOL_ERROR',
            'Check the error details and try again'
          )

    output({ error: aiReadableMessage(enhancedError) }, true)
    process.exit(1)
  }
}

main()
