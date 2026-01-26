# Pages Tool - Full Documentation

## Overview
Page lifecycle: create, get, update, archive, restore, duplicate.

## Important
- **parent_id required** for create (cannot create workspace-level pages)
- Returns **markdown content** for get action

## Actions

### create
```json
{"action": "create", "title": "Meeting Notes", "parent_id": "xxx", "content": "# Agenda\n- Item 1"}
```

### get
Default (clean markdown):
```json
{"action": "get", "page_id": "xxx"}
```

With inline block IDs (for targeted block operations):
```json
{"action": "get", "page_id": "xxx", "include_block_ids": true}
```

Returns markdown with block IDs as HTML comments:
```markdown
## Section Title <!-- block:abc123 -->
Content here... <!-- block:def456 -->
- List item <!-- block:ghi789 -->
```

### update
```json
{"action": "update", "page_id": "xxx", "append_content": "\n## New Section"}
```

Insert content after a specific block:
```json
{"action": "update", "page_id": "xxx", "append_content": "New paragraph", "insert_after": "block-id"}
```

Replace all content:
```json
{"action": "update", "page_id": "xxx", "content": "# Fresh Content\nReplaces everything"}
```

### archive
```json
{"action": "archive", "page_ids": ["xxx", "yyy"]}
```

### restore
```json
{"action": "restore", "page_id": "xxx"}
```

### duplicate
```json
{"action": "duplicate", "page_id": "xxx"}
```

## Parameters
- `page_id` - Page ID (required for most actions)
- `page_ids` - Multiple page IDs for batch operations
- `title` - Page title
- `content` - Markdown content (replaces all for update)
- `append_content` / `prepend_content` - Markdown to add
- `insert_after` - Block ID for positional insert (use with append_content)
- `parent_id` - Parent page or database ID
- `properties` - Page properties (for database pages)
- `icon` - Emoji icon
- `cover` - Cover image URL
- `include_block_ids` - Embed block IDs inline in markdown output (default: false)
