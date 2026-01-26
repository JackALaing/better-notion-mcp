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
  block_id?: string
  block_ids?: string[] // For bulk delete
  content?: string // Markdown format
  include_refs?: boolean // For children action: include block IDs for follow-up operations
  cascade?: boolean // For delete: also delete all nested children
}

/**
 * Recursively collect all child block IDs for cascade delete
 */
async function collectChildBlockIds(notion: Client, blockId: string): Promise<string[]> {
  const childIds: string[] = []

  try {
    let cursor: string | undefined
    do {
      const response = await notion.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100
      })

      for (const block of response.results as any[]) {
        childIds.push(block.id)
        if (block.has_children) {
          const grandchildren = await collectChildBlockIds(notion, block.id)
          childIds.push(...grandchildren)
        }
      }

      cursor = response.has_more ? response.next_cursor ?? undefined : undefined
    } while (cursor)
  } catch {
    // Block may not have children or may not exist - ignore errors
  }

  return childIds
}

/**
 * Unified blocks tool
 * Maps to: GET/PATCH/DELETE /v1/blocks/{id} and GET/PATCH /v1/blocks/{id}/children
 */
export async function blocks(notion: Client, input: BlocksInput): Promise<any> {
  return withErrorHandling(async () => {
    // Validation: delete allows block_id OR block_ids, others require block_id
    if (input.action === 'delete') {
      const ids = input.block_ids || (input.block_id ? [input.block_id] : [])
      if (ids.length === 0) {
        throw new NotionMCPError(
          'block_id or block_ids required for delete',
          'VALIDATION_ERROR',
          'Provide at least one block ID to delete'
        )
      }
    } else if (!input.block_id) {
      throw new NotionMCPError('block_id required', 'VALIDATION_ERROR', 'Provide block_id')
    }

    switch (input.action) {
      case 'get': {
        // block_id is guaranteed by validation above
        const blockId = input.block_id!
        const block: any = await notion.blocks.retrieve({ block_id: blockId })
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
        // block_id is guaranteed by validation above
        const blockId = input.block_id!
        // Recursively fetch all blocks including nested children
        const blocksList = await fetchBlocksRecursively(
          (blkId, cursor) =>
            notion.blocks.children.list({
              block_id: blkId,
              start_cursor: cursor,
              page_size: 100
            }),
          blockId
        )
        const markdown = blocksToMarkdown(blocksList as any)
        const result: any = {
          action: 'children',
          block_id: blockId,
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
        // block_id is guaranteed by validation above
        const blockId = input.block_id!
        if (!input.content) {
          throw new NotionMCPError('content required for append', 'VALIDATION_ERROR', 'Provide markdown content')
        }
        const blocksList = markdownToBlocks(input.content)
        await notion.blocks.children.append({
          block_id: blockId,
          children: blocksList as any
        })
        return {
          action: 'append',
          block_id: blockId,
          appended_count: blocksList.length
        }
      }

      case 'update': {
        // block_id is guaranteed by validation above
        const blockId = input.block_id!
        if (!input.content) {
          throw new NotionMCPError('content required for update', 'VALIDATION_ERROR', 'Provide markdown content')
        }
        const block: any = await notion.blocks.retrieve({ block_id: blockId })
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
          block_id: blockId,
          ...updatePayload
        } as any)

        return {
          action: 'update',
          block_id: blockId,
          type: blockType,
          updated: true
        }
      }

      case 'delete': {
        const blockIds = input.block_ids || (input.block_id ? [input.block_id] : [])
        const results: Array<{ block_id: string; deleted: boolean; error?: string }> = []

        // Collect all IDs to delete (including children if cascade)
        let idsToDelete = [...blockIds]

        if (input.cascade) {
          for (const blockId of blockIds) {
            const childIds = await collectChildBlockIds(notion, blockId)
            idsToDelete.push(...childIds)
          }
          // Remove duplicates and reverse for bottom-up deletion (children first)
          idsToDelete = [...new Set(idsToDelete)].reverse()
        }

        // Delete blocks sequentially
        for (const blockId of idsToDelete) {
          try {
            await notion.blocks.delete({ block_id: blockId })
            results.push({ block_id: blockId, deleted: true })
          } catch (error: any) {
            const errorMsg = error?.body?.message || error?.message || 'Unknown error'
            results.push({
              block_id: blockId,
              deleted: false,
              error: errorMsg
            })
          }
        }

        const successCount = results.filter((r) => r.deleted).length
        const failCount = results.filter((r) => !r.deleted).length

        const response: any = {
          action: 'delete',
          processed: results.length,
          success_count: successCount,
          fail_count: failCount,
          cascade: input.cascade ?? false
        }

        // Only include results array when there are failures (reduces token bloat)
        if (failCount > 0) {
          response.results = results.filter((r) => !r.deleted)
        }

        return response
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
