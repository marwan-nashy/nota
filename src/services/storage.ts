import { Page, Database, Workspace, WorkspaceState } from '../types';

const STORAGE_KEY = 'better_notion_workspace_v2';
const OLD_STORAGE_KEY = 'better_notion_workspace_v1';

const INITIAL_PAGES: Record<string, Page> = {
  'welcome-page': {
    id: 'welcome-page',
    parentId: null,
    title: 'Welcome to Nota',
    icon: '👋',
    cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    isFavorite: true,
    isArchived: false,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now(),
    font: 'sans',
    fullWidth: false,
    smallText: false,
    blocks: [
      {
        id: 'b-callout-1',
        type: 'callout',
        icon: '⚡',
        content: '<b>Welcome to Nota!</b> Built from the ground up for extreme speed on potato PCs. Zero Electron bloat, 0ms input lag, and ~35MB RAM footprint.',
      },
      {
        id: 'b-h1-1',
        type: 'heading1',
        content: 'What makes this better?',
      },
      {
        id: 'b-p-1',
        type: 'paragraph',
        content: 'Traditional workspace apps are powerful, but running them on low-spec machines is painful because Electron bundles an entire copy of Chrome in the background. Here is what we fixed:',
      },
      {
        id: 'b-todo-1',
        type: 'todo',
        checked: true,
        content: 'Zero Electron bloat — runs on native lightweight webview (<35MB RAM).',
      },
      {
        id: 'b-todo-2',
        type: 'todo',
        checked: true,
        content: 'Local-first architecture — instantaneous typing with 0ms network latency.',
      },
      {
        id: 'b-todo-3',
        type: 'todo',
        checked: true,
        content: 'Full Block Graph: slash commands (/), drag-and-drop, markdown shortcuts.',
      },
      {
        id: 'b-todo-4',
        type: 'todo',
        checked: true,
        content: 'Databases: Table and Kanban Board views with typed columns and nested subpages.',
      },
      {
        id: 'b-div-1',
        type: 'divider',
        content: '',
      },
      {
        id: 'b-h2-1',
        type: 'heading2',
        content: 'Keyboard Shortcuts & Markdown',
      },
      {
        id: 'b-bullet-1',
        type: 'bullet',
        content: 'Type <code>/</code> anywhere on an empty line to open the block slash menu.',
      },
      {
        id: 'b-bullet-2',
        type: 'bullet',
        content: 'Type <code># </code>, <code>## </code>, or <code>### </code> for headings.',
      },
      {
        id: 'b-bullet-3',
        type: 'bullet',
        content: 'Type <code>[] </code> for todo checkboxes, or <code>- </code> for bullet points.',
      },
      {
        id: 'b-bullet-4',
        type: 'bullet',
        content: 'Press <code>Ctrl + K</code> or <code>Ctrl + P</code> anytime for the Quick Switcher.',
      },
      {
        id: 'b-quote-1',
        type: 'quote',
        content: 'Simplicity is prerequisite for reliability. — Edsger W. Dijkstra',
      },
    ],
  },
  'roadmap-page': {
    id: 'roadmap-page',
    parentId: null,
    title: 'Product Roadmap & Tasks',
    icon: '🎯',
    cover: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)',
    isFavorite: true,
    isArchived: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
    font: 'sans',
    fullWidth: true,
    smallText: false,
    blocks: [
      {
        id: 'b-callout-roadmap',
        type: 'callout',
        icon: '📊',
        content: 'This page features an inline <b>Relational Database</b>. Switch between <b>Table View</b> and <b>Kanban Board View</b> below to manage your tasks.',
      },
      {
        id: 'b-db-1',
        type: 'database',
        databaseId: 'db-roadmap',
        content: 'Product Tasks & Milestones',
      },
    ],
  },
  'notes-page': {
    id: 'notes-page',
    parentId: null,
    title: 'Quick Notes & Scratchpad',
    icon: '💡',
    cover: null,
    isFavorite: false,
    isArchived: false,
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now(),
    font: 'serif',
    fullWidth: false,
    smallText: false,
    blocks: [
      {
        id: 'b-toggle-1',
        type: 'toggle',
        isOpen: true,
        content: 'Click here to expand / collapse this toggle block',
      },
      {
        id: 'b-toggle-sub',
        type: 'paragraph',
        content: 'Toggle blocks keep your documents clean and organized without cluttering your view.',
      },
      {
        id: 'b-code-1',
        type: 'code',
        language: 'typescript',
        content: `// Blazingly fast memory check\nfunction getMemoryUsage() {\n  return "34.2 MB (vs Electron 900+ MB)";\n}`,
      },
    ],
  },
};

const INITIAL_DATABASES: Record<string, Database> = {
  'db-roadmap': {
    id: 'db-roadmap',
    title: 'Engineering Tasks & Features',
    view: 'board',
    columns: [
      { id: 'c-title', name: 'Task Name', type: 'title' },
      {
        id: 'c-status',
        name: 'Status',
        type: 'status',
        options: [
          { id: 'not-started', label: 'Not Started', color: '#e0e0e0' },
          { id: 'in-progress', label: 'In Progress', color: '#cce2ff' },
          { id: 'done', label: 'Completed', color: '#c3f0c8' },
        ],
      },
      {
        id: 'c-priority',
        name: 'Priority',
        type: 'select',
        options: [
          { id: 'p1', label: 'High Priority', color: '#fed7d7' },
          { id: 'p2', label: 'Medium', color: '#feebc8' },
          { id: 'p3', label: 'Low', color: '#e2e8f0' },
        ],
      },
      { id: 'c-verified', name: 'Verified on Potato PC', type: 'checkbox' },
      { id: 'c-date', name: 'Due Date', type: 'date' },
    ],
    rows: [
      {
        id: 'row-1',
        cells: {
          'c-title': 'Rip out Electron & use native webview',
          'c-status': 'done',
          'c-priority': 'p1',
          'c-verified': true,
          'c-date': '2026-10-31',
        },
      },
      {
        id: 'row-2',
        cells: {
          'c-title': 'Implement instant block slash menu (/)',
          'c-status': 'done',
          'c-priority': 'p1',
          'c-verified': true,
          'c-date': '2026-10-31',
        },
      },
      {
        id: 'row-3',
        cells: {
          'c-title': 'Kanban Board Drag & Move (HTML5 DnD)',
          'c-status': 'done',
          'c-priority': 'p1',
          'c-verified': true,
          'c-date': '2026-10-31',
        },
      },
      {
        id: 'row-4',
        cells: {
          'c-title': 'Quick Search Switcher (Ctrl + K)',
          'c-status': 'done',
          'c-priority': 'p2',
          'c-verified': true,
          'c-date': '2026-10-31',
        },
      },
      {
        id: 'row-5',
        cells: {
          'c-title': 'Offline-first Local File & JSON Sync',
          'c-status': 'done',
          'c-priority': 'p1',
          'c-verified': true,
          'c-date': '2026-10-31',
        },
      },
    ],
  },
};

const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws-default',
  name: 'My Workspace',
  icon: '🚀',
  pages: INITIAL_PAGES,
  databases: INITIAL_DATABASES,
  activePageId: 'welcome-page',
  createdAt: Date.now(),
};

export function loadWorkspace(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.workspaces && parsed.activeWorkspaceId) {
        return parsed;
      }
    }

    // Try migration from v1
    const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldRaw) {
      const oldParsed = JSON.parse(oldRaw);
      if (oldParsed && oldParsed.pages) {
        const migratedWorkspace: Workspace = {
          id: 'ws-default',
          name: 'My Workspace',
          icon: '🚀',
          pages: oldParsed.pages,
          databases: oldParsed.databases || INITIAL_DATABASES,
          activePageId: oldParsed.activePageId || 'welcome-page',
          createdAt: Date.now(),
        };

        return {
          workspaces: { 'ws-default': migratedWorkspace },
          activeWorkspaceId: 'ws-default',
          sidebarOpen: oldParsed.sidebarOpen ?? true,
          theme: oldParsed.theme || 'dark',
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load workspace from local storage, using initial state', err);
  }

  return {
    workspaces: {
      'ws-default': DEFAULT_WORKSPACE,
    },
    activeWorkspaceId: 'ws-default',
    sidebarOpen: true,
    theme: 'dark', // Dark by default!
  };
}

export function saveWorkspace(state: WorkspaceState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save workspace state', err);
  }
}

export function exportWorkspaceJSON(state: WorkspaceState): string {
  return JSON.stringify(state, null, 2);
}

export function exportPageMarkdown(page: Page): string {
  let md = `# ${page.icon ? page.icon + ' ' : ''}${page.title}\n\n`;

  for (const block of page.blocks) {
    switch (block.type) {
      case 'heading1':
        md += `# ${stripHtml(block.content)}\n\n`;
        break;
      case 'heading2':
        md += `## ${stripHtml(block.content)}\n\n`;
        break;
      case 'heading3':
        md += `### ${stripHtml(block.content)}\n\n`;
        break;
      case 'todo':
        md += `- [${block.checked ? 'x' : ' '}] ${stripHtml(block.content)}\n`;
        break;
      case 'bullet':
        md += `- ${stripHtml(block.content)}\n`;
        break;
      case 'number':
        md += `1. ${stripHtml(block.content)}\n`;
        break;
      case 'quote':
        md += `> ${stripHtml(block.content)}\n\n`;
        break;
      case 'callout':
        md += `> [!NOTE]\n> ${block.icon || '💡'} ${stripHtml(block.content)}\n\n`;
        break;
      case 'divider':
        md += `---\n\n`;
        break;
      case 'code':
        md += `\`\`\`${block.language || ''}\n${block.content}\n\`\`\`\n\n`;
        break;
      default:
        md += `${stripHtml(block.content)}\n\n`;
        break;
    }
  }

  return md;
}

function stripHtml(html: string): string {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
