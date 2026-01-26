/**
 * Markdown to Notion Blocks Converter
 * Converts markdown text to Notion block format
 */

export interface NotionBlock {
  object: 'block'
  type: string
  [key: string]: any
}

export interface RichText {
  type: 'text'
  text: {
    content: string
    link?: { url: string } | null
  }
  annotations: {
    bold: boolean
    italic: boolean
    strikethrough: boolean
    underline: boolean
    code: boolean
    color: string
  }
  plain_text?: string
  href?: string | null
}

/**
 * Convert markdown string to Notion blocks
 */
export function markdownToBlocks(markdown: string): NotionBlock[] {
  const lines = markdown.split('\n')
  const blocks: NotionBlock[] = []

  // Stack for tracking nested list items
  const listStack: Array<{ block: NotionBlock; indent: number }> = []

  function flushListStack(): void {
    while (listStack.length > 0) {
      const item = listStack.pop()!
      if (listStack.length > 0) {
        addChildToListItem(listStack[listStack.length - 1].block, item.block)
      } else {
        blocks.push(item.block)
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check if current line is a list item
    const parsedList = parseListItem(line)

    // Flush list stack when transitioning out of list context
    if (!parsedList && listStack.length > 0) {
      flushListStack()
    }

    // Skip empty lines
    if (!line.trim()) {
      continue
    }

    // Handle list items with nesting support
    if (parsedList) {
      const newBlock = createListItemBlock(parsedList)

      // Pop items at same or deeper indent - attach to parents
      while (listStack.length > 0 &&
             listStack[listStack.length - 1].indent >= parsedList.indent) {
        const completed = listStack.pop()!
        if (listStack.length > 0) {
          addChildToListItem(listStack[listStack.length - 1].block, completed.block)
        } else {
          blocks.push(completed.block)
        }
      }

      listStack.push({ block: newBlock, indent: parsedList.indent })
      continue
    }

    // Heading
    if (line.startsWith('# ')) {
      blocks.push(createHeading(1, line.slice(2)))
    } else if (line.startsWith('## ')) {
      blocks.push(createHeading(2, line.slice(3)))
    } else if (line.startsWith('### ')) {
      blocks.push(createHeading(3, line.slice(4)))
    }
    // Code block
    else if (line.startsWith('```')) {
      const language = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push(createCodeBlock(codeLines.join('\n'), language))
    }
    // Toggle (HTML details/summary)
    else if (line.trim().startsWith('<details>')) {
      const toggleLines: string[] = [line]
      i++
      let depth = 1
      while (i < lines.length && depth > 0) {
        if (lines[i].includes('<details>')) depth++
        if (lines[i].includes('</details>')) depth--
        if (depth > 0) toggleLines.push(lines[i])
        i++
      }
      i-- // Back up one since the for loop will increment
      blocks.push(createToggle(toggleLines))
    }
    // Table (starts with |)
    else if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [line]
      i++
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      i-- // Back up one since the for loop will increment
      blocks.push(createTable(tableLines))
    }
    // Callout (GitHub-style or emoji-prefixed quote)
    else if (line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i)) {
      const calloutMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)/i)
      const calloutType = calloutMatch?.[1]?.toUpperCase() || 'NOTE'
      const firstLineText = calloutMatch?.[2] || ''
      const contentLines: string[] = firstLineText ? [firstLineText] : []
      
      // Collect continuation lines (lines starting with >)
      i++
      while (i < lines.length && lines[i].startsWith('>')) {
        contentLines.push(lines[i].slice(1).trim())
        i++
      }
      i-- // Back up one
      
      blocks.push(createCallout(contentLines.join('\n'), calloutType))
    }
    // Callout with emoji prefix (> 💡 text)
    else if (line.match(/^>\s*[\u{1F300}-\u{1F9FF}]/u)) {
      const emojiMatch = line.match(/^>\s*([\u{1F300}-\u{1F9FF}])\s*(.*)/u)
      const emoji = emojiMatch?.[1] || '💡'
      const firstLineText = emojiMatch?.[2] || ''
      const contentLines: string[] = firstLineText ? [firstLineText] : []
      
      // Collect continuation lines
      i++
      while (i < lines.length && lines[i].startsWith('>')) {
        contentLines.push(lines[i].slice(1).trim())
        i++
      }
      i--
      
      blocks.push(createCalloutWithEmoji(contentLines.join('\n'), emoji))
    }
    // Quote
    else if (line.startsWith('> ')) {
      blocks.push(createQuote(line.slice(2)))
    }
    // Divider
    else if (line.match(/^[-*]{3,}$/)) {
      blocks.push(createDivider())
    }
    // Image: ![alt](url)
    else if (line.match(/^!\[.*?\]\(.*?\)$/)) {
      const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/)
      if (imageMatch) {
        const alt = imageMatch[1] || ''
        const url = imageMatch[2] || ''
        blocks.push(createImage(url, alt))
      }
    }
    // Embed: standalone URL on its own line (common video/embed sites)
    else if (line.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|twitter\.com|x\.com|codepen\.io|figma\.com|miro\.com|loom\.com|spotify\.com)/i)) {
      blocks.push(createEmbed(line.trim()))
    }
    // Regular paragraph
    else {
      blocks.push(createParagraph(line))
    }
  }

  // Flush remaining list items at end of input
  flushListStack()

  return blocks
}

/**
 * Block with optional nested children (for recursive fetching)
 */
export interface BlockWithChildren extends NotionBlock {
  children?: BlockWithChildren[]
}

export interface BlocksToMarkdownOptions {
  includeBlockIds?: boolean
}

/**
 * Convert Notion blocks to markdown, handling nested children
 */
export function blocksToMarkdown(
  blocks: (NotionBlock | BlockWithChildren)[],
  depth: number = 0,
  options: BlocksToMarkdownOptions = {}
): string {
  const lines: string[] = []
  const indent = '  '.repeat(depth) // 2 spaces per nesting level
  const { includeBlockIds = false } = options

  // Helper to append block ID comment if enabled
  const withBlockId = (line: string, blockId?: string): string => {
    if (includeBlockIds && blockId) {
      return `${line} <!-- block:${blockId} -->`
    }
    return line
  }

  for (const block of blocks) {
    const blockWithChildren = block as BlockWithChildren
    const blockId = (block as any).id

    switch (block.type) {
      case 'heading_1':
        lines.push(withBlockId(`# ${richTextToMarkdown(block.heading_1.rich_text)}`, blockId))
        break
      case 'heading_2':
        lines.push(withBlockId(`## ${richTextToMarkdown(block.heading_2.rich_text)}`, blockId))
        break
      case 'heading_3':
        lines.push(withBlockId(`### ${richTextToMarkdown(block.heading_3.rich_text)}`, blockId))
        break
      case 'paragraph':
        lines.push(withBlockId(`${indent}${richTextToMarkdown(block.paragraph.rich_text)}`, blockId))
        break
      case 'bulleted_list_item':
        lines.push(withBlockId(`${indent}- ${richTextToMarkdown(block.bulleted_list_item.rich_text)}`, blockId))
        // Recursively process nested children
        if (blockWithChildren.children && blockWithChildren.children.length > 0) {
          lines.push(blocksToMarkdown(blockWithChildren.children, depth + 1, options))
        }
        break
      case 'numbered_list_item':
        lines.push(withBlockId(`${indent}1. ${richTextToMarkdown(block.numbered_list_item.rich_text)}`, blockId))
        // Recursively process nested children
        if (blockWithChildren.children && blockWithChildren.children.length > 0) {
          lines.push(blocksToMarkdown(blockWithChildren.children, depth + 1, options))
        }
        break
      case 'to_do':
        const checked = block.to_do?.checked ? 'x' : ' '
        lines.push(withBlockId(`${indent}- [${checked}] ${richTextToMarkdown(block.to_do.rich_text)}`, blockId))
        if (blockWithChildren.children && blockWithChildren.children.length > 0) {
          lines.push(blocksToMarkdown(blockWithChildren.children, depth + 1, options))
        }
        break
      case 'toggle':
        lines.push(withBlockId(`${indent}<details>`, blockId))
        lines.push(`${indent}<summary>${richTextToMarkdown(block.toggle.rich_text)}</summary>`)
        if (blockWithChildren.children && blockWithChildren.children.length > 0) {
          lines.push(blocksToMarkdown(blockWithChildren.children, depth + 1, options))
        }
        lines.push(`${indent}</details>`)
        break
      case 'code':
        lines.push(withBlockId(`\`\`\`${block.code.language || ''}`, blockId))
        lines.push(richTextToMarkdown(block.code.rich_text))
        lines.push('```')
        break
      case 'quote':
        lines.push(withBlockId(`> ${richTextToMarkdown(block.quote.rich_text)}`, blockId))
        if (blockWithChildren.children && blockWithChildren.children.length > 0) {
          // Prefix each line of nested content with >
          const nestedContent = blocksToMarkdown(blockWithChildren.children, 0, options)
          lines.push(nestedContent.split('\n').map(line => `> ${line}`).join('\n'))
        }
        break
      case 'callout':
        const icon = block.callout?.icon?.emoji || '💡'
        lines.push(withBlockId(`${indent}> ${icon} ${richTextToMarkdown(block.callout.rich_text)}`, blockId))
        if (blockWithChildren.children && blockWithChildren.children.length > 0) {
          const nestedContent = blocksToMarkdown(blockWithChildren.children, 0, options)
          lines.push(nestedContent.split('\n').map(line => `${indent}> ${line}`).join('\n'))
        }
        break
      case 'divider':
        lines.push(withBlockId('---', blockId))
        break
      case 'table':
        // Handle table blocks
        if (blockWithChildren.children && blockWithChildren.children.length > 0) {
          const tableRows = blockWithChildren.children
          const rowStrings: string[] = []

          for (let rowIdx = 0; rowIdx < tableRows.length; rowIdx++) {
            const row = tableRows[rowIdx]
            if (row.type === 'table_row' && row.table_row?.cells) {
              const cells = row.table_row.cells.map((cell: RichText[]) => richTextToMarkdown(cell))
              const rowLine = `| ${cells.join(' | ')} |`
              // Add block ID to first row only (represents the table)
              rowStrings.push(rowIdx === 0 ? withBlockId(rowLine, blockId) : rowLine)

              // Add separator after header row
              if (rowIdx === 0 && block.table?.has_column_header) {
                rowStrings.push(`| ${cells.map(() => '---').join(' | ')} |`)
              }
            }
          }

          lines.push(rowStrings.join('\n'))
        }
        break
      case 'column_list':
        // Handle column layouts - render each column's content sequentially
        if (blockWithChildren.children && blockWithChildren.children.length > 0) {
          for (const column of blockWithChildren.children) {
            if (column.type === 'column' && (column as BlockWithChildren).children) {
              lines.push(blocksToMarkdown((column as BlockWithChildren).children!, depth, options))
            }
          }
        }
        break
      case 'image':
        // Handle image blocks
        const imageUrl = block.image?.external?.url || block.image?.file?.url || ''
        const imageCaption = block.image?.caption ? richTextToMarkdown(block.image.caption) : ''
        if (imageUrl) {
          lines.push(withBlockId(`![${imageCaption}](${imageUrl})`, blockId))
        }
        break
      case 'embed':
        // Handle embed blocks
        const embedUrl = block.embed?.url || ''
        if (embedUrl) {
          lines.push(withBlockId(embedUrl, blockId))
        }
        break
      case 'video':
        // Handle video blocks (similar to embed)
        const videoUrl = block.video?.external?.url || block.video?.file?.url || ''
        if (videoUrl) {
          lines.push(withBlockId(videoUrl, blockId))
        }
        break
      case 'bookmark':
        // Handle bookmark blocks
        const bookmarkUrl = block.bookmark?.url || ''
        const bookmarkCaption = block.bookmark?.caption ? richTextToMarkdown(block.bookmark.caption) : ''
        if (bookmarkUrl) {
          lines.push(withBlockId(bookmarkCaption ? `[${bookmarkCaption}](${bookmarkUrl})` : bookmarkUrl, blockId))
        }
        break
      default:
        // Unsupported block type, skip
        break
    }
  }

  return lines.join('\n')
}

/**
 * Parse inline markdown formatting to rich text
 */
export function parseRichText(text: string): RichText[] {
  const richText: RichText[] = []
  let current = ''
  let bold = false
  let italic = false
  let code = false
  let strikethrough = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    // Link [text](url)
    if (char === '[') {
      const closeBracket = text.indexOf(']', i)
      const openParen = closeBracket !== -1 ? text.indexOf('(', closeBracket) : -1
      const closeParen = openParen !== -1 ? text.indexOf(')', openParen) : -1

      if (closeBracket !== -1 && openParen === closeBracket + 1 && closeParen !== -1) {
        if (current) {
          richText.push(createRichText(current, { bold, italic, code, strikethrough }))
          current = ''
        }

        const linkText = text.slice(i + 1, closeBracket)
        const linkUrl = text.slice(openParen + 1, closeParen)

        richText.push({
          type: 'text',
          text: { content: linkText, link: { url: linkUrl } },
          annotations: {
            bold,
            italic,
            strikethrough,
            underline: false,
            code,
            color: 'default'
          }
        })

        i = closeParen
        continue
      }
    }

    // Bold **text**
    if (char === '*' && next === '*') {
      if (current) {
        richText.push(createRichText(current, { bold, italic, code, strikethrough }))
        current = ''
      }
      bold = !bold
      i++ // Skip next *
      continue
    }
    // Italic *text*
    else if (char === '*' && next !== '*') {
      if (current) {
        richText.push(createRichText(current, { bold, italic, code, strikethrough }))
        current = ''
      }
      italic = !italic
      continue
    }
    // Code `text`
    else if (char === '`') {
      if (current) {
        richText.push(createRichText(current, { bold, italic, code, strikethrough }))
        current = ''
      }
      code = !code
      continue
    }
    // Strikethrough ~~text~~
    else if (char === '~' && next === '~') {
      if (current) {
        richText.push(createRichText(current, { bold, italic, code, strikethrough }))
        current = ''
      }
      strikethrough = !strikethrough
      i++ // Skip next ~
      continue
    }

    current += char
  }

  if (current) {
    richText.push(createRichText(current, { bold, italic, code, strikethrough }))
  }

  return richText.length > 0 ? richText : [createRichText(text)]
}

/**
 * Convert rich text array to plain markdown
 */
function richTextToMarkdown(richText: RichText[]): string {
  if (!richText || !Array.isArray(richText)) return ''

  return richText
    .map((rt) => {
      if (!rt || !rt.text) return ''

      let text = rt.text.content || ''
      const annotations = rt.annotations || {}

      if (annotations.bold) text = `**${text}**`
      if (annotations.italic) text = `*${text}*`
      if (annotations.code) text = `\`${text}\``
      if (annotations.strikethrough) text = `~~${text}~~`
      if (rt.text.link) text = `[${text}](${rt.text.link.url})`
      return text
    })
    .join('')
}

/**
 * Extract plain text from rich text
 */
export function extractPlainText(richText: RichText[]): string {
  return richText.map((rt) => rt.text.content).join('')
}

// Helper creators
function createRichText(
  content: string,
  annotations: { bold?: boolean; italic?: boolean; code?: boolean; strikethrough?: boolean } = {}
): RichText {
  return {
    type: 'text',
    text: { content, link: null },
    annotations: {
      bold: annotations.bold || false,
      italic: annotations.italic || false,
      strikethrough: annotations.strikethrough || false,
      underline: false,
      code: annotations.code || false,
      color: 'default'
    }
  }
}

function createHeading(level: 1 | 2 | 3, text: string): NotionBlock {
  const type = `heading_${level}` as 'heading_1' | 'heading_2' | 'heading_3'
  return {
    object: 'block',
    type,
    [type]: {
      rich_text: parseRichText(text),
      color: 'default'
    }
  }
}

function createParagraph(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: parseRichText(text),
      color: 'default'
    }
  }
}

function createBulletedListItem(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: parseRichText(text),
      color: 'default'
    }
  }
}

function createNumberedListItem(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: {
      rich_text: parseRichText(text),
      color: 'default'
    }
  }
}

function createToDoItem(text: string, checked: boolean): NotionBlock {
  return {
    object: 'block',
    type: 'to_do',
    to_do: {
      rich_text: parseRichText(text),
      checked: checked,
      color: 'default'
    }
  }
}

function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/)
  const spaces = match ? match[1].length : 0
  return Math.floor(spaces / 2)  // 2 spaces per level (matches blocksToMarkdown output)
}

function parseListItem(line: string): {
  type: 'bulleted' | 'numbered' | 'todo';
  text: string;
  indent: number;
  checked?: boolean;
} | null {
  const indent = getIndentLevel(line)
  const trimmed = line.trimStart()

  // To-do: - [ ] or - [x] (must check before bulleted)
  const todoMatch = trimmed.match(/^-\s*\[([xX ])\]\s*(.*)$/)
  if (todoMatch) {
    return {
      type: 'todo',
      text: todoMatch[2],
      indent,
      checked: todoMatch[1].toLowerCase() === 'x'
    }
  }

  // Bulleted: - or *
  const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/)
  if (bulletMatch) {
    return { type: 'bulleted', text: bulletMatch[1], indent }
  }

  // Numbered: 1. 2. etc
  const numberedMatch = trimmed.match(/^\d+\.\s+(.*)$/)
  if (numberedMatch) {
    return { type: 'numbered', text: numberedMatch[1], indent }
  }

  return null
}

function createListItemBlock(parsed: NonNullable<ReturnType<typeof parseListItem>>): NotionBlock {
  switch (parsed.type) {
    case 'todo':
      return createToDoItem(parsed.text, parsed.checked ?? false)
    case 'bulleted':
      return createBulletedListItem(parsed.text)
    case 'numbered':
      return createNumberedListItem(parsed.text)
  }
}

function addChildToListItem(parent: NotionBlock, child: NotionBlock): void {
  const typeKey = parent.type as 'bulleted_list_item' | 'numbered_list_item' | 'to_do'
  const content = parent[typeKey]
  if (!content.children) {
    content.children = []
  }
  content.children.push(child)
}

function createCodeBlock(code: string, language: string): NotionBlock {
  return {
    object: 'block',
    type: 'code',
    code: {
      rich_text: [createRichText(code)],
      language: language || 'plain text'
    }
  }
}

function createQuote(text: string): NotionBlock {
  return {
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: parseRichText(text),
      color: 'default'
    }
  }
}

function createDivider(): NotionBlock {
  return {
    object: 'block',
    type: 'divider',
    divider: {}
  }
}

function createImage(url: string, caption: string = ''): NotionBlock {
  const block: any = {
    object: 'block',
    type: 'image',
    image: {
      type: 'external',
      external: {
        url: url
      }
    }
  }
  
  if (caption) {
    block.image.caption = parseRichText(caption)
  }
  
  return block
}

function createEmbed(url: string): NotionBlock {
  return {
    object: 'block',
    type: 'embed',
    embed: {
      url: url
    }
  }
}

/**
 * Create a Notion table from markdown table lines
 */
function createTable(lines: string[]): NotionBlock {
  // Parse table rows, skipping the separator line (|---|---|)
  const rows: string[][] = []
  
  for (const line of lines) {
    // Skip separator lines
    if (line.match(/^\|[\s-:|]+\|$/)) continue
    
    // Parse cells: split by |, trim, filter empty first/last from split
    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter((cell, idx, arr) => idx !== 0 && idx !== arr.length - 1)
    
    if (cells.length > 0) {
      rows.push(cells)
    }
  }
  
  if (rows.length === 0) {
    return createParagraph('(empty table)')
  }
  
  const columnCount = Math.max(...rows.map(r => r.length))
  const hasHeader = rows.length > 1
  
  // Create table_row children
  const tableRows: NotionBlock[] = rows.map(row => ({
    object: 'block',
    type: 'table_row',
    table_row: {
      cells: Array.from({ length: columnCount }, (_, i) => 
        parseRichText(row[i] || '')
      )
    }
  }))
  
  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: columnCount,
      has_column_header: hasHeader,
      has_row_header: false,
      children: tableRows
    }
  }
}

/**
 * Create a Notion toggle from HTML details/summary
 */
function createToggle(lines: string[]): NotionBlock {
  let title = 'Toggle'
  const contentLines: string[] = []
  let inSummary = false
  let pastSummary = false
  
  for (const line of lines) {
    // Extract summary text
    const summaryMatch = line.match(/<summary>(.*?)<\/summary>/)
    if (summaryMatch) {
      title = summaryMatch[1].trim()
      pastSummary = true
      continue
    }
    
    if (line.includes('<summary>')) {
      inSummary = true
      const afterTag = line.split('<summary>')[1]
      if (afterTag) title = afterTag.trim()
      continue
    }
    
    if (line.includes('</summary>')) {
      inSummary = false
      pastSummary = true
      const beforeTag = line.split('</summary>')[0]
      if (beforeTag && inSummary) title += ' ' + beforeTag.trim()
      continue
    }
    
    if (inSummary) {
      title += ' ' + line.trim()
      continue
    }
    
    // Skip details tags
    if (line.trim() === '<details>' || line.trim() === '</details>') continue
    
    if (pastSummary && line.trim()) {
      contentLines.push(line)
    }
  }
  
  // Parse content into child blocks
  const children = contentLines.length > 0 
    ? markdownToBlocks(contentLines.join('\n'))
    : []
  
  const toggle: any = {
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: parseRichText(title),
      color: 'default'
    }
  }
  
  if (children.length > 0) {
    toggle.toggle.children = children
  }
  
  return toggle
}

/**
 * Create a Notion callout from GitHub-style admonition
 */
function createCallout(text: string, type: string): NotionBlock {
  const emojiMap: Record<string, string> = {
    'NOTE': 'ℹ️',
    'TIP': '💡',
    'IMPORTANT': '❗',
    'WARNING': '⚠️',
    'CAUTION': '🔴'
  }
  
  const emoji = emojiMap[type] || '💡'
  
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: parseRichText(text),
      icon: { type: 'emoji', emoji },
      color: 'default'
    }
  }
}

/**
 * Create a Notion callout with custom emoji
 */
function createCalloutWithEmoji(text: string, emoji: string): NotionBlock {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: parseRichText(text),
      icon: { type: 'emoji', emoji },
      color: 'default'
    }
  }
}

function isListItem(line: string): boolean {
  const trimmed = line.trimStart()
  if (/^-\s*\[[xX ]\]\s/.test(trimmed)) return true  // to-do
  if (/^[-*]\s/.test(trimmed)) return true            // bulleted
  if (/^\d+\.\s/.test(trimmed)) return true           // numbered
  return false
}
