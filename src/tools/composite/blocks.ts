/**
 * Blocks Mega Tool
 * All block operations in one unified interface
 */

import type { Client } from '@notionhq/client'
import { NotionMCPError, withErrorHandling } from '../helpers/errors.js'
import { blocksToMarkdown, markdownToBlocks } from '../helpers/markdown.js'
import { autoPaginate, fetchBlocksRecursively } from '../helpers/pagination.js'

export interface BlocksInput {
  action: 'get' | 'children' | 'append' | 'update' | 'delete'
  block_id: string
  content?: string // Markdown format
  include_refs?: boolean // For children action: include block IDs for follow-up operations
}

/**
 * Unified blocks tool
 * Maps to: GET/PATCH/DELETE /v1/blocks/{id} and GET/PATCH /v1/blocks/{id}/children
 */
export async function blocks(notion: Client, input: BlocksInput): Promise<any> {
  return withErrorHandling(async () => {
    if (!input.block_id) {
      throw new NotionMCPError('block_id required', 'VALIDATION_ERROR', 'Provide block_id')
    }

    switch (input.action) {
      case 'get': {
        const block: any = await notion.blocks.retrieve({ block_id: input.block_id })
        return {
          action: 'get',
          block_id: block.id,
          type: block.type,
          has_children: block.has_children,
          archived: block.archived,
          block
        }
      }

      case 'children': {
        // Recursively fetch all blocks including nested children
        const blocksList = await fetchBlocksRecursively(
          (blockId, cursor) =>
            notion.blocks.children.list({
              block_id: blockId,
              start_cursor: cursor,
              page_size: 100
            }),
          input.block_id
        )
        const markdown = blocksToMarkdown(blocksList as any)
        const result: any = {
          action: 'children',
          block_id: input.block_id,
          total_children: blocksList.length,
          markdown
        }
        if (input.include_refs) {
          // Flatten block refs for include_refs (recursive would complicate the interface)
          const flattenRefs = (blocks: any[]): any[] => {
            const refs: any[] = []
            for (const b of blocks) {
              refs.push({ id: b.id, type: b.type, has_children: b.has_children })
              if (b.children) {
                refs.push(...flattenRefs(b.children))
              }
            }
            return refs
          }
          result.block_refs = flattenRefs(blocksList)
        }
        return result
      }

      case 'append': {
        if (!input.content) {
          throw new NotionMCPError('content required for append', 'VALIDATION_ERROR', 'Provide markdown content')
        }
        const blocksList = markdownToBlocks(input.content)
        await notion.blocks.children.append({
          block_id: input.block_id,
          children: blocksList as any
        })
        return {
          action: 'append',
          block_id: input.block_id,
          appended_count: blocksList.length
        }
      }

      case 'update': {
        if (!input.content) {
          throw new NotionMCPError('content required for update', 'VALIDATION_ERROR', 'Provide markdown content')
        }
        const block: any = await notion.blocks.retrieve({ block_id: input.block_id })
        const blockType = block.type
        const newBlocks = markdownToBlocks(input.content)

        if (newBlocks.length === 0) {
          throw new NotionMCPError('Content must produce at least one block', 'VALIDATION_ERROR', 'Invalid markdown')
        }

        const newContent = newBlocks[0]
        const newContentType = newContent.type
        const updatePayload: any = {}

        // Supported block types for update
        const supportedTypes = [
          'paragraph',
          'heading_1',
          'heading_2',
          'heading_3',
          'bulleted_list_item',
          'numbered_list_item',
          'quote'
        ]

        if (!supportedTypes.includes(blockType)) {
          throw new NotionMCPError(
            `Block type '${blockType}' cannot be updated`,
            'VALIDATION_ERROR',
            'Only text blocks can be updated'
          )
        }

        // Extract rich_text from the parsed content (whatever type it parsed as)
        // and apply it to the target block type
        const richText = (newContent as any)[newContentType]?.rich_text || []
        
        if (richText.length === 0) {
          throw new NotionMCPError(
            'Could not extract text content',
            'VALIDATION_ERROR',
            'Ensure content produces valid rich text'
          )
        }

        updatePayload[blockType] = {
          rich_text: richText
        }

        await notion.blocks.update({
          block_id: input.block_id,
          ...updatePayload
        } as any)

        return {
          action: 'update',
          block_id: input.block_id,
          type: blockType,
          updated: true
        }
      }

      case 'delete': {
        await notion.blocks.delete({ block_id: input.block_id })
        return {
          action: 'delete',
          block_id: input.block_id,
          deleted: true
        }
      }

      default:
        throw new NotionMCPError(
          `Unknown action: ${input.action}`,
          'VALIDATION_ERROR',
          'Supported actions: get, children, append, update, delete'
        )
    }
  })()
}
