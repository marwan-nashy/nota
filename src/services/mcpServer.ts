import { Workspace, Page } from '../types';
import { exportPageMarkdown, parseMarkdownToBlocks } from './storage';
import { bm25 } from './bm25Search';
import { nanoid } from 'nanoid';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'nota_list_pages',
    description: 'List all pages and notes in the active Nota workspace with their titles, IDs, icons, and update timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        includeArchived: {
          type: 'boolean',
          description: 'Whether to include archived pages (defaults to false)',
        },
      },
    },
  },
  {
    name: 'nota_get_page',
    description: 'Retrieve the complete markdown content, blocks, and metadata of a specific note by its page ID or title.',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The unique ID or title of the page to retrieve',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'nota_search_notes',
    description: 'Perform an Okapi BM25 relevance-ranked full-text search across all notes in the workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keywords or phrase',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'nota_list_tasks',
    description: 'Extract and list all to-do checklist items and action items across all documents in the workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'open', 'completed'],
          description: 'Filter tasks by completion status (default "open")',
        },
      },
    },
  },
  {
    name: 'nota_create_page',
    description: 'Create a new document/note in the workspace with title and markdown blocks.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the new note',
        },
        content: {
          type: 'string',
          description: 'Markdown formatted content of the page',
        },
        icon: {
          type: 'string',
          description: 'Emoji icon for the page (default 📝)',
        },
      },
      required: ['title'],
    },
  },
];

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * Handle Model Context Protocol (MCP) JSON-RPC requests
 */
export async function handleMcpRequest(
  request: JsonRpcRequest,
  workspace: Workspace,
  onAddPage?: (page: Page) => void
): Promise<JsonRpcResponse> {
  const { id, method, params } = request;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
            },
            serverInfo: {
              name: 'nota-mcp-server',
              version: '1.1.0',
            },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        };

      case 'tools/call': {
        const toolName = params?.name;
        const args = params?.arguments || {};

        if (toolName === 'nota_list_pages') {
          const includeArchived = !!args.includeArchived;
          const pages = Object.values(workspace.pages)
            .filter((p) => includeArchived || !p.isArchived)
            .map((p) => ({
              id: p.id,
              title: p.title,
              icon: p.icon || '📄',
              blockCount: p.blocks.length,
              tags: p.tags || [],
              updatedAt: new Date(p.updatedAt).toISOString(),
            }));

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(pages, null, 2),
                },
              ],
            },
          };
        }

        if (toolName === 'nota_get_page') {
          const target = args.pageId?.toLowerCase();
          const page =
            workspace.pages[args.pageId] ||
            Object.values(workspace.pages).find(
              (p) => p.title.toLowerCase() === target
            );

          if (!page) {
            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: `Page not found: ${args.pageId}` }],
                isError: true,
              },
            };
          }

          const markdown = exportPageMarkdown(page);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `# ${page.icon} ${page.title}\n\n${markdown}`,
                },
              ],
            },
          };
        }

        if (toolName === 'nota_search_notes') {
          const query = args.query || '';
          const limit = args.limit || 5;
          const searchResults = bm25.search(workspace.pages, query, limit);

          const formatted = searchResults.map((r) => ({
            id: r.page.id,
            title: r.page.title,
            icon: r.page.icon,
            score: Math.round(r.score * 100) / 100,
            snippet: r.snippet,
          }));

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(formatted, null, 2),
                },
              ],
            },
          };
        }

        if (toolName === 'nota_list_tasks') {
          const status = args.status || 'open';
          const tasks: { pageId: string; pageTitle: string; task: string; completed: boolean }[] = [];

          for (const page of Object.values(workspace.pages)) {
            if (page.isArchived) continue;
            for (const block of page.blocks) {
              if (block.type === 'todo') {
                const isDone = !!block.checked;
                if (status === 'all' || (status === 'open' && !isDone) || (status === 'completed' && isDone)) {
                  tasks.push({
                    pageId: page.id,
                    pageTitle: page.title,
                    task: block.content.replace(/<[^>]*>/g, ''),
                    completed: isDone,
                  });
                }
              }
            }
          }

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tasks, null, 2),
                },
              ],
            },
          };
        }

        if (toolName === 'nota_create_page') {
          const title = args.title || 'Untitled Note';
          const content = args.content || '';
          const icon = args.icon || '📝';

          const parsed = parseMarkdownToBlocks(content, title);
          const newPage: Page = {
            id: 'page-' + nanoid(8),
            parentId: null,
            title,
            icon,
            cover: null,
            isFavorite: false,
            isArchived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            font: 'sans',
            fullWidth: false,
            smallText: false,
            blocks: parsed.blocks,
          };

          onAddPage?.(newPage);

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Successfully created page "${title}" with ID ${newPage.id}.`,
                },
              ],
            },
          };
        }

        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Unknown tool: ${toolName}` },
        };
      }

      case 'resources/list': {
        const resources = Object.values(workspace.pages)
          .filter((p) => !p.isArchived)
          .map((p) => ({
            uri: `nota://pages/${p.id}`,
            name: `${p.icon || '📄'} ${p.title}`,
            mimeType: 'text/markdown',
          }));

        return {
          jsonrpc: '2.0',
          id,
          result: { resources },
        };
      }

      case 'resources/read': {
        const uri = params?.uri || '';
        const match = uri.match(/^nota:\/\/pages\/(.+)$/);
        if (!match) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Invalid resource URI: ${uri}` },
          };
        }

        const pageId = match[1];
        const page = workspace.pages[pageId];
        if (!page) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Resource not found: ${uri}` },
          };
        }

        return {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'text/markdown',
                text: exportPageMarkdown(page),
              },
            ],
          },
        };
      }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not supported: ${method}` },
        };
    }
  } catch (err: any) {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: err?.message || 'Internal MCP Error' },
    };
  }
}

/**
 * Generate a standalone Node.js MCP server script that can be configured in Claude Desktop or Antigravity
 */
export function generateStandaloneMcpScript(): string {
  return `#!/usr/bin/env node
/**
 * Nota Local MCP Server
 * Connects Claude Desktop, Antigravity, and AI Agents directly to your Nota Workspace.
 * 
 * Usage:
 *   node nota-mcp-server.js /path/to/workspace-export.json
 */

const fs = require('fs');
const readline = require('readline');

const workspacePath = process.argv[2];
if (!workspacePath) {
  console.error("Please provide the path to your Nota workspace JSON backup.");
  console.error("Example: node nota-mcp-server.js ./nota-backup.json");
  process.exit(1);
}

let workspace;
try {
  const data = fs.readFileSync(workspacePath, 'utf8');
  const parsed = JSON.parse(data);
  workspace = parsed.workspaces ? Object.values(parsed.workspaces)[0] : parsed;
} catch (e) {
  console.error("Failed to load workspace file:", e.message);
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const { id, method, params } = req;

    if (method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: 'nota-mcp-local', version: '1.1.0' }
        }
      });
    } else if (method === 'tools/list') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'nota_list_pages',
              description: 'List notes in workspace',
              inputSchema: { type: 'object', properties: {} }
            },
            {
              name: 'nota_get_page',
              description: 'Get page text by title or ID',
              inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] }
            }
          ]
        }
      });
    } else if (method === 'tools/call') {
      const tool = params?.name;
      if (tool === 'nota_list_pages') {
        const pages = Object.values(workspace.pages || {}).map(p => ({ id: p.id, title: p.title, icon: p.icon }));
        send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(pages, null, 2) }] } });
      } else if (tool === 'nota_get_page') {
        const pid = params?.arguments?.pageId;
        const page = Object.values(workspace.pages || {}).find(p => p.id === pid || p.title.toLowerCase() === (pid || '').toLowerCase());
        if (!page) {
          send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: 'Page not found' }], isError: true } });
        } else {
          const text = page.blocks ? page.blocks.map(b => b.content).join('\\n\\n') : '';
          send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: '# ' + page.title + '\\n\\n' + text }] } });
        }
      }
    } else {
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
    }
  } catch (err) {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
  }
});

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\\n');
}
`;
}
