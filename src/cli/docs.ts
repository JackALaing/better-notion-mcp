// Auto-generated embedded documentation for CLI help command
// Do not edit directly - regenerate with build script if docs change

export const DOCS: Record<string, string> = {
  pages: `# Pages Tool - Full Documentation

## Overview
Page lifecycle: create, get, update, archive, restore, duplicate.

## Important
- **parent_id required** for create (cannot create workspace-level pages)
- Returns **markdown content** for get action

## Actions

### create
\`\`\`json
{"action": "create", "title": "Meeting Notes", "parent_id": "xxx", "content": "# Agenda\\n- Item 1"}
\`\`\`

### get
Default (clean markdown):
\`\`\`json
{"action": "get", "page_id": "xxx"}
\`\`\`

With inline block IDs (for targeted block operations):
\`\`\`json
{"action": "get", "page_id": "xxx", "include_block_ids": true}
\`\`\`

Returns markdown with block IDs as HTML comments:
\`\`\`markdown
## Section Title <!-- block:abc123 -->
Content here... <!-- block:def456 -->
- List item <!-- block:ghi789 -->
\`\`\`

### update
\`\`\`json
{"action": "update", "page_id": "xxx", "append_content": "\\n## New Section"}
\`\`\`

Insert content after a specific block:
\`\`\`json
{"action": "update", "page_id": "xxx", "append_content": "New paragraph", "insert_after": "block-id"}
\`\`\`

Replace all content:
\`\`\`json
{"action": "update", "page_id": "xxx", "content": "# Fresh Content\\nReplaces everything"}
\`\`\`

### archive
\`\`\`json
{"action": "archive", "page_ids": ["xxx", "yyy"]}
\`\`\`

### restore
\`\`\`json
{"action": "restore", "page_id": "xxx"}
\`\`\`

### duplicate
\`\`\`json
{"action": "duplicate", "page_id": "xxx"}
\`\`\`

## Parameters
- \`page_id\` - Page ID (required for most actions)
- \`page_ids\` - Multiple page IDs for batch operations
- \`title\` - Page title
- \`content\` - Markdown content (replaces all for update)
- \`append_content\` / \`prepend_content\` - Markdown to add
- \`insert_after\` - Block ID for positional insert (use with append_content)
- \`parent_id\` - Parent page or database ID
- \`properties\` - Page properties (for database pages)
- \`icon\` - Emoji icon
- \`cover\` - Cover image URL
- \`include_block_ids\` - Embed block IDs inline in markdown output (default: false)`,

  databases: `# Databases Tool - Full Documentation

## Overview
Database operations: create, get, query, create_page, update_page, delete_page, create_data_source, update_data_source, update_database.

## Architecture
- **Database** = container holding one or more data sources
- **Data Source** = has schema (properties) and rows (pages)

## Workflow
1. create → Creates database + initial data source
2. get → Retrieves data_source_id
3. query/create_page/update_page → Uses data_source_id (auto-fetched)

## Actions

### create
\`\`\`json
{"action": "create", "parent_id": "xxx", "title": "Tasks", "properties": {"Status": {"select": {"options": [{"name": "Todo"}, {"name": "Done"}]}}}}
\`\`\`

### get
\`\`\`json
{"action": "get", "database_id": "xxx"}
\`\`\`

### query
\`\`\`json
{"action": "query", "database_id": "xxx", "filters": {"property": "Status", "select": {"equals": "Done"}}}
\`\`\`

### create_page
Accepts either \`database_id\` or \`data_source_id\`:
\`\`\`json
{"action": "create_page", "database_id": "xxx", "pages": [{"properties": {"Name": "Task 1", "Status": "Todo"}}]}
\`\`\`
\`\`\`json
{"action": "create_page", "data_source_id": "yyy", "pages": [{"properties": {"Name": "Task 2"}}]}
\`\`\`

### update_page
\`\`\`json
{"action": "update_page", "page_id": "yyy", "page_properties": {"Status": "Done"}}
\`\`\`

### delete_page
\`\`\`json
{"action": "delete_page", "page_ids": ["yyy", "zzz"]}
\`\`\`

## Parameters
- \`database_id\` - Database ID (container)
- \`data_source_id\` - Data source ID (can be used instead of database_id for create_page)
- \`parent_id\` - Parent page ID
- \`title\` - Title
- \`properties\` - Schema properties
- \`filters\` / \`sorts\` / \`limit\` - Query options
- \`search\` - Smart search across text fields
- \`pages\` - Array of pages for bulk operations
- \`page_properties\` - Properties to update`,

  blocks: `# Blocks Tool - Full Documentation

## Overview
Block-level content: get, children, append, update, delete.

## Important
- **Page IDs are valid block IDs** (page is root block)
- Use for **precise edits** within pages
- For full page content, use pages tool instead

## Getting Block IDs

**For targeted edits** (delete/update specific content you can see):
→ Use \`pages get\` with \`include_block_ids: true\` (recommended)

**For structural operations** (find all headings, check which blocks have children):
→ Use \`blocks children\` with \`include_refs: true\`

Inline block IDs appear as HTML comments (invisible when rendered):
\`\`\`markdown
## Heading <!-- block:abc123 -->
Content here <!-- block:def456 -->
\`\`\`

## Actions

### get
\`\`\`json
{"action": "get", "block_id": "xxx"}
\`\`\`

### children
\`\`\`json
{"action": "children", "block_id": "xxx"}
\`\`\`
Returns markdown of child blocks.

Add \`include_refs: true\` to get block IDs as a separate array:
\`\`\`json
{"action": "children", "block_id": "xxx", "include_refs": true}
\`\`\`

### append
\`\`\`json
{"action": "append", "block_id": "page-id", "content": "## New Section\\nParagraph text"}
\`\`\`

### update
\`\`\`json
{"action": "update", "block_id": "block-id", "content": "Updated text"}
\`\`\`

### delete
Single block:
\`\`\`json
{"action": "delete", "block_id": "block-id"}
\`\`\`

Bulk delete (multiple blocks):
\`\`\`json
{"action": "delete", "block_ids": ["id1", "id2", "id3"]}
\`\`\`

Cascade delete (auto-delete all nested children):
\`\`\`json
{"action": "delete", "block_id": "parent-id", "cascade": true}
\`\`\`

Delete response (compact on success, detailed on failure):
\`\`\`json
// Full success - no results array
{
  "action": "delete",
  "processed": 3,
  "success_count": 3,
  "fail_count": 0,
  "cascade": false
}

// Partial failure - results shows only failed blocks
{
  "action": "delete",
  "processed": 3,
  "success_count": 2,
  "fail_count": 1,
  "cascade": false,
  "results": [
    {"block_id": "id3", "deleted": false, "error": "Block not found"}
  ]
}
\`\`\`

## Parameters
- \`block_id\` - Block ID (required for get/children/append/update, optional for delete if using block_ids)
- \`block_ids\` - Array of block IDs (for bulk delete)
- \`content\` - Markdown content (for append/update)
- \`include_refs\` - Return block IDs in children response (for follow-up operations)
- \`cascade\` - Auto-delete nested children when deleting parent (default: false)`,

  users: `# Users Tool - Full Documentation

## Overview
User info: list, get, me, from_workspace.

## Important
- \`list\` may fail without user:read permission
- Use \`from_workspace\` as fallback (extracts from page metadata)

## Actions

### me
\`\`\`json
{"action": "me"}
\`\`\`
Returns bot/integration info.

### list
\`\`\`json
{"action": "list"}
\`\`\`
Requires user:read permission.

### get
\`\`\`json
{"action": "get", "user_id": "xxx"}
\`\`\`

### from_workspace
\`\`\`json
{"action": "from_workspace"}
\`\`\`
Extracts users from created_by/last_edited_by in accessible pages.

## Parameters
- \`user_id\` - User ID (for get action)`,

  workspace: `# Workspace Tool - Full Documentation

## Overview
Workspace: info, search.

## Important
- Search returns only content **shared with integration**
- Use \`filter.object = "data_source"\` for databases
- Data source results include \`database_id\` for convenience

## Actions

### info
\`\`\`json
{"action": "info"}
\`\`\`
Returns bot owner, workspace details.

### search
\`\`\`json
{"action": "search", "query": "meeting notes", "filter": {"object": "page"}, "limit": 10}
\`\`\`

Search databases:
\`\`\`json
{"action": "search", "query": "tasks", "filter": {"object": "data_source"}}
\`\`\`

Sort results:
\`\`\`json
{"action": "search", "query": "project", "sort": {"direction": "descending", "timestamp": "last_edited_time"}}
\`\`\`

## Parameters
- \`query\` - Search query
- \`filter.object\` - "page" or "data_source"
- \`sort.direction\` - "ascending" or "descending"
- \`sort.timestamp\` - "last_edited_time" or "created_time"
- \`limit\` - Max results`,

  comments: `# Comments Tool - Full Documentation

## Overview
Comments: list, create.

## Threading
- Use \`page_id\` for new discussion
- Use \`discussion_id\` (from list) for replies

## Actions

### list
\`\`\`json
{"action": "list", "page_id": "xxx"}
\`\`\`

### create (new discussion)
\`\`\`json
{"action": "create", "page_id": "xxx", "content": "Great work!"}
\`\`\`

### create (reply)
\`\`\`json
{"action": "create", "discussion_id": "thread-id", "content": "I agree"}
\`\`\`

## Parameters
- \`page_id\` - Page ID
- \`discussion_id\` - Discussion ID (for replies)
- \`content\` - Comment content`,

  content_convert: `# Content Convert Tool - Full Documentation

## Overview
Convert: markdown-to-blocks, blocks-to-markdown.

## Note
Most tools (pages, blocks) handle markdown automatically. Use this for preview/validation only.

## Actions

### markdown-to-blocks
\`\`\`json
{"direction": "markdown-to-blocks", "content": "# Heading\\nParagraph\\n- List item"}
\`\`\`

### blocks-to-markdown
\`\`\`json
{"direction": "blocks-to-markdown", "content": [{"type": "paragraph", "paragraph": {...}}]}
\`\`\`

## Parameters
- \`direction\` - "markdown-to-blocks" or "blocks-to-markdown"
- \`content\` - String (markdown) or array (blocks)`,
}
