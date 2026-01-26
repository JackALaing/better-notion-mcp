# Blocks Tool - Full Documentation

## Overview
Block-level content: get, children, append, update, delete.

## Important
- **Page IDs are valid block IDs** (page is root block)
- Use for **precise edits** within pages
- For full page content, use pages tool instead

## Getting Block IDs

**For targeted edits** (delete/update specific content you can see):
→ Use `pages get` with `include_block_ids: true` (recommended)

**For structural operations** (find all headings, check which blocks have children):
→ Use `blocks children` with `include_refs: true`

Inline block IDs appear as HTML comments (invisible when rendered):
```markdown
## Heading <!-- block:abc123 -->
Content here <!-- block:def456 -->
```

## Actions

### get
```json
{"action": "get", "block_id": "xxx"}
```

### children
```json
{"action": "children", "block_id": "xxx"}
```
Returns markdown of child blocks.

Add `include_refs: true` to get block IDs as a separate array:
```json
{"action": "children", "block_id": "xxx", "include_refs": true}
```

### append
```json
{"action": "append", "block_id": "page-id", "content": "## New Section\nParagraph text"}
```

### update
```json
{"action": "update", "block_id": "block-id", "content": "Updated text"}
```

### delete
Single block:
```json
{"action": "delete", "block_id": "block-id"}
```

Bulk delete (multiple blocks):
```json
{"action": "delete", "block_ids": ["id1", "id2", "id3"]}
```

Cascade delete (auto-delete all nested children):
```json
{"action": "delete", "block_id": "parent-id", "cascade": true}
```

Delete response (compact on success, detailed on failure):
```json
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
```

## Parameters
- `block_id` - Block ID (required for get/children/append/update, optional for delete if using block_ids)
- `block_ids` - Array of block IDs (for bulk delete)
- `content` - Markdown content (for append/update)
- `include_refs` - Return block IDs in children response (for follow-up operations)
- `cascade` - Auto-delete nested children when deleting parent (default: false)
