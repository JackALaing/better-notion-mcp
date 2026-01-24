# Better Notion MCP

**Markdown-First MCP Server for Notion - Optimized for AI Agents**

[![npm](https://img.shields.io/npm/v/@n24q02m/better-notion-mcp)](https://www.npmjs.com/package/@n24q02m/better-notion-mcp)
[![Docker](https://img.shields.io/docker/v/n24q02m/better-notion-mcp?label=docker)](https://hub.docker.com/r/n24q02m/better-notion-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Why "Better"?

**8 composite tools** that consolidate Notion's 28+ REST API endpoints into action-based operations optimized for AI agents.

### vs. Official Notion MCP Server

| Feature | Better Notion MCP | Official Notion MCP |
|---------|-------------------|---------------------|
| **Content Format** | **Markdown** (human-readable) | Raw JSON blocks |
| **Operations** | **Composite actions** (1 call) | Atomic (2+ calls) |
| **Pagination** | **Auto-pagination** | Manual cursor |
| **Bulk Operations** | **Native batch support** | Loop manually |
| **Tools** | **8 tools** (30+ actions) | 28+ endpoint tools |
| **Token Efficiency** | **~550 tokens** | ~7,000 tokens (13x more) |

---

## Quick Start

Get your token: <https://www.notion.so/my-integrations> → Create integration → Copy token → Share pages

### NPX (Recommended)

```json
{
  "mcpServers": {
    "better-notion": {
      "command": "npx",
      "args": ["-y", "@n24q02m/better-notion-mcp@latest"],
      "env": {
        "NOTION_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Docker

```json
{
  "mcpServers": {
    "better-notion": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "NOTION_TOKEN", "n24q02m/better-notion-mcp:latest"],
      "env": {
        "NOTION_TOKEN": "your_token_here"
      }
    }
  }
}
```

---

## Tools

| Tool | Actions |
|------|---------|  
| `pages` | create, get, update, archive, restore, duplicate |
| `databases` | create, get, query, create_page, update_page, delete_page, create_data_source, update_data_source, update_database |
| `blocks` | get, children, append, update, delete |
| `users` | list, get, me, from_workspace |
| `workspace` | info, search |
| `comments` | list, create |
| `content_convert` | markdown-to-blocks, blocks-to-markdown |
| `help` | Get full documentation for any tool |

### Key Features

**Page Content Operations:**
- `pages.update` with `content` - Full page replacement using `erase_content` API (efficient single-call clear)
- `pages.update` with `append_content` - Append to end of page
- `pages.update` with `insert_after` - Insert content after a specific block ID
- Auto-chunking for >100 blocks (Notion API limit)

**Database Page Creation:**
- `databases.create_page` supports `content` field for page body (not just properties)
- Auto-chunking for large content

---

## Token Optimization

**~77% token reduction** via tiered descriptions:

| Tier | Purpose | When |
|------|---------|------|
| **Tier 1** | Compressed descriptions | Always loaded |
| **Tier 2** | Full docs via `help` tool | On-demand |
| **Tier 3** | MCP Resources | Supported clients |

```json
{"name": "help", "tool_name": "pages"}
```

---

## Limitations

**Supported Blocks:**
- ✅ Headings, Paragraphs, Lists, Code blocks, Quotes, Dividers
- ✅ Inline: bold, italic, code, strikethrough, links

**Unsupported Blocks:**
- ❌ Tables, Toggles, Callouts, Columns, Databases, Embeds, Images, Files

**API Constraints:**
- `insert_after` limited to <100 blocks per insert (use full `content` replacement for larger updates)

---

## Build from Source

```bash
git clone https://github.com/n24q02m/better-notion-mcp
cd better-notion-mcp
mise run setup
pnpm build
```

**Requirements:** Node.js 24+, pnpm

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT - See [LICENSE](LICENSE)
