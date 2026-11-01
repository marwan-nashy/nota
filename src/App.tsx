import React, { useState, useEffect, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { Block, BlockType, Database, Page, Workspace, WorkspaceState, AppTheme } from './types';
import { loadWorkspace, saveWorkspace, exportWorkspaceJSON } from './services/storage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { PageHeader } from './components/PageHeader';
import { BlockItem } from './components/BlockItem';
import { SlashMenu } from './components/SlashMenu';
import { CommandPalette } from './components/CommandPalette';
import { TrashModal } from './components/TrashModal';
import { FloatingToolbar } from './components/FloatingToolbar';
import { TemplatesModal } from './components/TemplatesModal';
import { GraphView } from './components/GraphView';
import { LockModal } from './components/LockModal';
import { OutlineDrawer } from './components/OutlineDrawer';
import { Plus, Link as LinkIcon, Lock, KeyRound } from 'lucide-react';
import { t, Language } from './i18n';

export function App() {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(loadWorkspace);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [slashMenuState, setSlashMenuState] = useState<{
    isOpen: boolean;
    position: { top: number; left: number };
    query: string;
    blockId: string | null;
  }>({
    isOpen: false,
    position: { top: 0, left: 0 },
    query: '',
    blockId: null,
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isGraphViewOpen, setIsGraphViewOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [draggedBlockIdx, setDraggedBlockIdx] = useState<number | null>(null);
  const [dragOverBlockIdx, setDragOverBlockIdx] = useState<number | null>(null);

  const language: Language = workspaceState.language || 'en';

  // Sync theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-oled', 'theme-catppuccin', 'theme-nord', 'theme-sepia');
    const currentTheme = workspaceState.theme || 'dark';
    if (currentTheme !== 'light' && currentTheme !== 'sepia') {
      root.classList.add('dark');
    }
    if (currentTheme !== 'dark' && currentTheme !== 'light') {
      root.classList.add(`theme-${currentTheme}`);
    }
  }, [workspaceState.theme]);

  // Sync language and dir to document element
  useEffect(() => {
    const lang = workspaceState.language || 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [workspaceState.language]);

  // Debounced auto-save
  useEffect(() => {
    const handler = setTimeout(() => {
      saveWorkspace(workspaceState);
    }, 300);
    return () => clearTimeout(handler);
  }, [workspaceState]);

  // Global keyboard shortcuts (Ctrl+K, Ctrl+P, Ctrl+\)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'p')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setWorkspaceState((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentWorkspace =
    workspaceState.workspaces[workspaceState.activeWorkspaceId] ||
    Object.values(workspaceState.workspaces)[0];

  const activePage =
    currentWorkspace && currentWorkspace.pages
      ? currentWorkspace.pages[currentWorkspace.activePageId] ||
        Object.values(currentWorkspace.pages)[0]
      : null;

  // Calculate backlinks to the current page across the active workspace
  const backlinks = useMemo(() => {
    if (!activePage || !currentWorkspace?.pages) return [];
    const results: { page: Page; snippet: string }[] = [];
    const pageId = activePage.id;
    const pageTitle = (activePage.title || '').trim().toLowerCase();

    Object.values(currentWorkspace.pages).forEach((otherPage) => {
      if (otherPage.id === pageId || otherPage.isArchived) return;
      for (const b of otherPage.blocks) {
        if (b.targetPageId === pageId) {
          results.push({ page: otherPage, snippet: otherPage.title || t('untitled', language) });
          break;
        }
        if (pageTitle && b.content) {
          const stripped = b.content.replace(/<[^>]*>/g, '').toLowerCase();
          if (stripped.includes(`@${pageTitle}`) || stripped.includes(`[[${pageTitle}]]`)) {
            results.push({
              page: otherPage,
              snippet: b.content.replace(/<[^>]*>/g, '').slice(0, 100),
            });
            break;
          }
        }
      }
    });
    return results;
  }, [activePage?.id, activePage?.title, currentWorkspace?.pages, language]);

  // Workspace Operations
  const handleSelectWorkspace = (id: string) => {
    setWorkspaceState((prev) => ({ ...prev, activeWorkspaceId: id }));
  };

  const handleCreateWorkspace = (name: string, icon: string) => {
    const newWsId = 'ws-' + nanoid(6);
    const initialPageId = 'page-' + nanoid(6);
    const newWs: Workspace = {
      id: newWsId,
      name,
      icon,
      createdAt: Date.now(),
      activePageId: initialPageId,
      databases: {},
      pages: {
        [initialPageId]: {
          id: initialPageId,
          parentId: null,
          title: `Welcome to ${name}`,
          icon: icon,
          cover: null,
          isFavorite: false,
          isArchived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          font: 'sans',
          fullWidth: false,
          smallText: false,
          blocks: [
            {
              id: 'b-init-1',
              type: 'callout',
              icon: icon,
              content: `Welcome to your new workspace <b>${name}</b>!`,
            },
            {
              id: 'b-init-2',
              type: 'paragraph',
              content: 'Type <code>/</code> to insert blocks, or start typing directly.',
            },
          ],
        },
      },
    };

    setWorkspaceState((prev) => ({
      ...prev,
      workspaces: { ...prev.workspaces, [newWsId]: newWs },
      activeWorkspaceId: newWsId,
    }));
  };

  const handleRenameWorkspace = (id: string, newName: string) => {
    setWorkspaceState((prev) => {
      const target = prev.workspaces[id];
      if (!target) return prev;
      return {
        ...prev,
        workspaces: {
          ...prev.workspaces,
          [id]: { ...target, name: newName },
        },
      };
    });
  };

  const handleChangeWorkspaceIcon = (id: string, newIcon: string) => {
    setWorkspaceState((prev) => {
      const target = prev.workspaces[id];
      if (!target) return prev;
      return {
        ...prev,
        workspaces: {
          ...prev.workspaces,
          [id]: { ...target, icon: newIcon },
        },
      };
    });
  };

  const handleDeleteWorkspace = (id: string) => {
    setWorkspaceState((prev) => {
      const remaining = Object.values(prev.workspaces).filter((w) => w.id !== id);
      if (remaining.length === 0) return prev;
      const copy = { ...prev.workspaces };
      delete copy[id];
      return {
        ...prev,
        workspaces: copy,
        activeWorkspaceId: prev.activeWorkspaceId === id ? remaining[0].id : prev.activeWorkspaceId,
      };
    });
  };

  // Helper to update current workspace
  const updateCurrentWorkspace = (updater: (ws: Workspace) => Workspace) => {
    setWorkspaceState((prev) => {
      const cur = prev.workspaces[prev.activeWorkspaceId];
      if (!cur) return prev;
      return {
        ...prev,
        workspaces: {
          ...prev.workspaces,
          [cur.id]: updater(cur),
        },
      };
    });
  };

  // Page Operations
  const handleSelectPage = (id: string) => {
    updateCurrentWorkspace((ws) => ({ ...ws, activePageId: id }));
  };

  const handleAddPage = (parentId: string | null = null) => {
    const newId = 'page-' + nanoid(8);
    const newPage: Page = {
      id: newId,
      parentId,
      title: 'Untitled',
      icon: '📄',
      cover: null,
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      font: 'sans',
      fullWidth: false,
      smallText: false,
      blocks: [
        {
          id: 'b-' + nanoid(6),
          type: 'paragraph',
          content: '',
        },
      ],
    };

    updateCurrentWorkspace((ws) => ({
      ...ws,
      pages: { ...ws.pages, [newId]: newPage },
      activePageId: newId,
    }));
  };

  const handleUpdatePage = (updated: Page) => {
    updateCurrentWorkspace((ws) => ({
      ...ws,
      pages: { ...ws.pages, [updated.id]: updated },
    }));
  };

  // Reorder Blocks via Drag-and-Drop or Move Actions
  const handleMoveBlock = (fromIndex: number, toIndex: number) => {
    if (!activePage || fromIndex === toIndex) return;
    const newBlocks = [...activePage.blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    handleUpdatePage({
      ...activePage,
      blocks: newBlocks,
      updatedAt: Date.now(),
    });
  };

  // Open or Create Today's Daily Note
  const handleOpenDailyNote = () => {
    if (!currentWorkspace) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const existing = Object.values(currentWorkspace.pages).find(
      (p) => !p.isArchived && (p.dateString === todayStr || (p.title && p.title.includes(todayStr)))
    );
    if (existing) {
      handleSelectPage(existing.id);
    } else {
      const newId = 'page-' + nanoid(8);
      const dateFormatted = new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const newPage: Page = {
        id: newId,
        parentId: null,
        title: dateFormatted,
        icon: '📅',
        cover: null,
        isFavorite: false,
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        font: 'sans',
        fullWidth: false,
        smallText: false,
        isDailyNote: true,
        dateString: todayStr,
        blocks: [
          { id: 'b-' + nanoid(6), type: 'heading2', content: language === 'ar' ? '🎯 أولويات اليوم' : '🎯 Daily Priorities' },
          { id: 'b-' + nanoid(6), type: 'todo', content: language === 'ar' ? 'أهم هدف لإنجازه اليوم' : 'Key goal for today', checked: false },
          { id: 'b-' + nanoid(6), type: 'heading2', content: language === 'ar' ? '📝 ملاحظات وأفكار' : '📝 Notes & Thoughts' },
          { id: 'b-' + nanoid(6), type: 'paragraph', content: '' },
          { id: 'b-' + nanoid(6), type: 'heading2', content: language === 'ar' ? '✨ تأملات اليوم' : '✨ Daily Reflection' },
          { id: 'b-' + nanoid(6), type: 'bullet', content: language === 'ar' ? 'ما الذي سار بشكل جيد اليوم؟' : 'What went well today?' },
        ],
      };
      updateCurrentWorkspace((ws) => ({
        ...ws,
        pages: { ...ws.pages, [newId]: newPage },
        activePageId: newId,
      }));
    }
  };

  // Open or Create Note for specific calendar date
  const handleSelectDate = (dateStr: string) => {
    if (!currentWorkspace) return;
    const existing = Object.values(currentWorkspace.pages).find(
      (p) => !p.isArchived && (p.dateString === dateStr || (p.title && p.title.includes(dateStr)))
    );
    if (existing) {
      handleSelectPage(existing.id);
    } else {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dateFormatted = d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const newId = 'page-' + nanoid(8);
      const newPage: Page = {
        id: newId,
        parentId: null,
        title: dateFormatted,
        icon: '📅',
        cover: null,
        isFavorite: false,
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        font: 'sans',
        fullWidth: false,
        smallText: false,
        isDailyNote: true,
        dateString: dateStr,
        blocks: [
          { id: 'b-' + nanoid(6), type: 'heading2', content: language === 'ar' ? '🎯 ملاحظات وتفاصيل' : '🎯 Notes & Agenda' },
          { id: 'b-' + nanoid(6), type: 'todo', content: '', checked: false },
        ],
      };
      updateCurrentWorkspace((ws) => ({
        ...ws,
        pages: { ...ws.pages, [newId]: newPage },
        activePageId: newId,
      }));
    }
  };

  // Handle Unlocked Page
  const handlePageUnlocked = (decryptedBlocks: Block[], removePermanently = false) => {
    if (!activePage) return;
    if (removePermanently) {
      handleUpdatePage({
        ...activePage,
        isLocked: false,
        encryptedData: undefined,
        salt: undefined,
        iv: undefined,
        blocks: decryptedBlocks,
        updatedAt: Date.now(),
      });
    } else {
      handleUpdatePage({
        ...activePage,
        blocks: decryptedBlocks,
        updatedAt: Date.now(),
      });
    }
  };

  const handleDeletePage = (id: string) => {
    updateCurrentWorkspace((ws) => {
      const updated = { ...ws.pages[id], isArchived: true };
      const nonArchived = Object.values(ws.pages).filter((p) => p.id !== id && !p.isArchived);
      const nextActiveId = nonArchived.length > 0 ? nonArchived[0].id : '';

      return {
        ...ws,
        pages: { ...ws.pages, [id]: updated },
        activePageId: ws.activePageId === id ? nextActiveId : ws.activePageId,
      };
    });
  };

  const handleRestorePage = (id: string) => {
    updateCurrentWorkspace((ws) => ({
      ...ws,
      pages: {
        ...ws.pages,
        [id]: { ...ws.pages[id], isArchived: false },
      },
    }));
  };

  const handlePermanentDeletePage = (id: string) => {
    updateCurrentWorkspace((ws) => {
      const copy = { ...ws.pages };
      delete copy[id];
      return { ...ws, pages: copy };
    });
  };

  const handleDuplicatePage = (id: string) => {
    if (!currentWorkspace) return;
    const source = currentWorkspace.pages[id];
    if (!source) return;
    const newId = 'page-' + nanoid(8);
    const dup: Page = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateCurrentWorkspace((ws) => ({
      ...ws,
      pages: { ...ws.pages, [newId]: dup },
      activePageId: newId,
    }));
  };

  const handleToggleFavorite = (id: string) => {
    updateCurrentWorkspace((ws) => ({
      ...ws,
      pages: {
        ...ws.pages,
        [id]: { ...ws.pages[id], isFavorite: !ws.pages[id].isFavorite },
      },
    }));
  };

  const THEMES: AppTheme[] = ['dark', 'oled', 'catppuccin', 'nord', 'sepia', 'light'];

  // Cycle through themes
  const handleToggleTheme = () => {
    setWorkspaceState((prev) => {
      const currentIdx = THEMES.indexOf(prev.theme as AppTheme);
      const nextTheme = THEMES[(currentIdx + 1) % THEMES.length];
      return {
        ...prev,
        theme: nextTheme,
      };
    });
  };

  // Directly select a specific theme
  const handleSelectTheme = (newTheme: AppTheme) => {
    setWorkspaceState((prev) => ({
      ...prev,
      theme: newTheme,
    }));
  };

  // Toggle interface language (English / Arabic)
  const handleToggleLanguage = () => {
    setWorkspaceState((prev) => ({
      ...prev,
      language: prev.language === 'ar' ? 'en' : 'ar',
    }));
  };

  // Block Operations
  const handleUpdateBlock = (updated: Block) => {
    if (!activePage) return;
    const newBlocks = activePage.blocks.map((b) => (b.id === updated.id ? updated : b));
    handleUpdatePage({ ...activePage, blocks: newBlocks, updatedAt: Date.now() });
  };

  const handleAddBlockBelow = (currentId: string, type: BlockType = 'paragraph') => {
    if (!activePage) return;
    const currentIndex = activePage.blocks.findIndex((b) => b.id === currentId);
    const newBlock: Block = {
      id: 'b-' + nanoid(6),
      type,
      content: '',
      checked: false,
    };

    const newBlocks = [...activePage.blocks];
    newBlocks.splice(currentIndex + 1, 0, newBlock);
    handleUpdatePage({ ...activePage, blocks: newBlocks, updatedAt: Date.now() });
    setFocusedBlockId(newBlock.id);
  };

  const handleDeleteBlock = (id: string) => {
    if (!activePage) return;
    if (activePage.blocks.length <= 1) {
      handleUpdateBlock({ ...activePage.blocks[0], type: 'paragraph', content: '' });
      return;
    }
    const idx = activePage.blocks.findIndex((b) => b.id === id);
    const prevBlock = activePage.blocks[idx - 1] || activePage.blocks[idx + 1];
    const newBlocks = activePage.blocks.filter((b) => b.id !== id);
    handleUpdatePage({ ...activePage, blocks: newBlocks, updatedAt: Date.now() });
    if (prevBlock) setFocusedBlockId(prevBlock.id);
  };

  const handleFocusPrevious = (currentId: string) => {
    if (!activePage) return;
    const idx = activePage.blocks.findIndex((b) => b.id === currentId);
    if (idx > 0) {
      setFocusedBlockId(activePage.blocks[idx - 1].id);
    }
  };

  const handleFocusNext = (currentId: string) => {
    if (!activePage) return;
    const idx = activePage.blocks.findIndex((b) => b.id === currentId);
    if (idx < activePage.blocks.length - 1) {
      setFocusedBlockId(activePage.blocks[idx + 1].id);
    }
  };

  // Apply Starter Template
  const handleApplyTemplate = (
    title: string,
    icon: string,
    cover: string | null,
    blocks: Block[]
  ) => {
    const newId = 'page-' + nanoid(8);
    const newPage: Page = {
      id: newId,
      parentId: null,
      title,
      icon,
      cover,
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      font: 'sans',
      fullWidth: false,
      smallText: false,
      blocks: blocks.map((b) => ({ ...b, id: 'b-' + nanoid(6) })),
    };

    updateCurrentWorkspace((ws) => ({
      ...ws,
      pages: { ...ws.pages, [newId]: newPage },
      activePageId: newId,
    }));
    setIsTemplatesOpen(false);
  };

  // Slash Menu Selection
  const handleOpenSlashMenu = (
    pos: { top: number; left: number },
    query: string,
    blockId: string
  ) => {
    setSlashMenuState({
      isOpen: true,
      position: pos,
      query,
      blockId,
    });
  };

  const handleSelectSlashItem = (type: BlockType, extra?: any) => {
    if (!slashMenuState.blockId || !activePage) return;

    if (type === 'database') {
      const dbId = 'db-' + nanoid(6);
      const newDb: Database = {
        id: dbId,
        title: extra?.view === 'board' ? 'Kanban Board' : 'Table Database',
        view: extra?.view || 'table',
        columns: [
          { id: 'c-title', name: 'Name', type: 'title' },
          {
            id: 'c-status',
            name: 'Status',
            type: 'status',
            options: [
              { id: 'not-started', label: 'Not Started', color: '#e0e0e0' },
              { id: 'in-progress', label: 'In Progress', color: '#cce2ff' },
              { id: 'done', label: 'Done', color: '#c3f0c8' },
            ],
          },
          { id: 'c-date', name: 'Date', type: 'date' },
        ],
        rows: [
          {
            id: 'row-1',
            cells: { 'c-title': 'First Item', 'c-status': 'not-started' },
          },
        ],
      };

      updateCurrentWorkspace((ws) => ({
        ...ws,
        databases: { ...ws.databases, [dbId]: newDb },
      }));

      handleUpdateBlock({
        id: slashMenuState.blockId,
        type: 'database',
        databaseId: dbId,
        content: '',
      });
    } else if (type === 'page_link') {
      const childPageId = 'page-' + nanoid(8);
      const childPage: Page = {
        id: childPageId,
        parentId: activePage.id,
        title: 'Untitled Sub-page',
        icon: '📄',
        cover: null,
        isFavorite: false,
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        font: 'sans',
        fullWidth: false,
        smallText: false,
        blocks: [
          {
            id: 'b-' + nanoid(6),
            type: 'paragraph',
            content: '',
          },
        ],
      };

      updateCurrentWorkspace((ws) => ({
        ...ws,
        pages: { ...ws.pages, [childPageId]: childPage },
      }));

      handleUpdateBlock({
        id: slashMenuState.blockId,
        type: 'page_link',
        content: 'Untitled Sub-page',
        targetPageId: childPageId,
      });
    } else {
      handleUpdateBlock({
        id: slashMenuState.blockId,
        type,
        content: extra?.content || (type === 'math' ? 'E = mc^2' : type === 'diagram' ? 'graph TD;\n  A[Start] --> B{Process};\n  B -->|Yes| C[Success];\n  B -->|No| D[Retry];' : ''),
      });
    }

    setSlashMenuState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleUpdateDatabase = (updatedDb: Database) => {
    updateCurrentWorkspace((ws) => ({
      ...ws,
      databases: {
        ...ws.databases,
        [updatedDb.id]: updatedDb,
      },
    }));
  };

  const handleExportWorkspace = () => {
    const json = exportWorkspaceJSON(workspaceState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nota-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportWorkspace = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.workspaces) {
        setWorkspaceState(parsed);
      }
    } catch (e) {
      alert('Invalid backup JSON file');
    }
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        workspaceState.theme === 'dark' ? 'dark' : ''
      } bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#ebebeb] transition-colors`}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        workspaces={workspaceState.workspaces}
        activeWorkspaceId={workspaceState.activeWorkspaceId}
        pages={currentWorkspace?.pages || {}}
        activePageId={currentWorkspace?.activePageId || ''}
        isOpen={workspaceState.sidebarOpen}
        theme={workspaceState.theme}
        language={language}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onDuplicatePage={handleDuplicatePage}
        onToggleFavorite={handleToggleFavorite}
        onToggleTheme={handleToggleTheme}
        onToggleLanguage={handleToggleLanguage}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onOpenTrash={() => setIsTrashOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenGraphView={() => setIsGraphViewOpen(true)}
        onOpenDailyNote={handleOpenDailyNote}
        onSelectDate={handleSelectDate}
        onExportWorkspace={handleExportWorkspace}
        onImportWorkspace={handleImportWorkspace}
        onCloseSidebar={() => setWorkspaceState((prev) => ({ ...prev, sidebarOpen: false }))}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onRenameWorkspace={handleRenameWorkspace}
        onChangeWorkspaceIcon={handleChangeWorkspaceIcon}
        onDeleteWorkspace={handleDeleteWorkspace}
      />

      {/* Main Document Workspace View */}
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-white dark:bg-[#191919] transition-colors">
        {activePage ? (
          <>
            <Navbar
              page={activePage}
              sidebarOpen={workspaceState.sidebarOpen}
              language={language}
              isOutlineOpen={isOutlineOpen}
              onToggleSidebar={() =>
                setWorkspaceState((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }))
              }
              onToggleOutline={() => setIsOutlineOpen(!isOutlineOpen)}
              onOpenLockModal={() => setIsLockModalOpen(true)}
              onUpdatePage={handleUpdatePage}
              onDeletePage={handleDeletePage}
            />

            {/* Scrollable Document Canvas */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-32">
              <div
                className={`mx-auto transition-all duration-150 ${
                  activePage.fullWidth ? 'max-w-6xl' : 'max-w-3xl'
                } ${activePage.font === 'serif' ? 'font-serif' : activePage.font === 'mono' ? 'font-mono' : 'font-sans'} ${
                  activePage.smallText ? 'text-xs' : 'text-sm'
                }`}
              >
                {/* Page Cover & Title */}
                <PageHeader page={activePage} language={language} onUpdatePage={handleUpdatePage} />

                {/* Locked Page Encrypted Screen or Blocks List */}
                {activePage.isLocked && (!activePage.blocks || activePage.blocks.length === 0) ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {t('pageLocked', language)}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
                      {t('pageIsLockedDesc', language)}
                    </p>
                    <button
                      onClick={() => setIsLockModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{t('unlockPage', language)}</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-2 sm:px-8 space-y-0.5">
                    {activePage.blocks.map((block, idx) => (
                      <BlockItem
                        key={block.id}
                        block={block}
                        index={idx}
                        language={language}
                        allBlocks={activePage.blocks}
                        isFocused={focusedBlockId === block.id}
                        database={block.databaseId ? currentWorkspace?.databases[block.databaseId] : undefined}
                        targetPageTitle={block.targetPageId && currentWorkspace?.pages[block.targetPageId] ? currentWorkspace.pages[block.targetPageId].title : undefined}
                        targetPageIcon={block.targetPageId && currentWorkspace?.pages[block.targetPageId] ? currentWorkspace.pages[block.targetPageId].icon : undefined}
                        onUpdateBlock={handleUpdateBlock}
                        onAddBlockBelow={handleAddBlockBelow}
                        onDeleteBlock={handleDeleteBlock}
                        onFocusBlock={(id) => setFocusedBlockId(id)}
                        onFocusPrevious={handleFocusPrevious}
                        onFocusNext={handleFocusNext}
                        onOpenSlashMenu={handleOpenSlashMenu}
                        onNavigateToPage={(pageId) => handleSelectPage(pageId)}
                        onUpdateDatabase={handleUpdateDatabase}
                        onDragStart={(i) => setDraggedBlockIdx(i)}
                        onDragOver={(i) => setDragOverBlockIdx(i)}
                        onDragLeave={() => setDragOverBlockIdx(null)}
                        onDrop={(targetIdx) => {
                          if (draggedBlockIdx !== null && draggedBlockIdx !== targetIdx) {
                            handleMoveBlock(draggedBlockIdx, targetIdx);
                          }
                          setDraggedBlockIdx(null);
                          setDragOverBlockIdx(null);
                        }}
                        onMoveBlock={handleMoveBlock}
                        isDragOver={dragOverBlockIdx === idx}
                        isDragging={draggedBlockIdx === idx}
                      />
                    ))}

                  {/* Linked References / Backlinks Section */}
                  {backlinks.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-[#2e2e2e]">
                      <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{t('backlinks', language)} ({backlinks.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {backlinks.map(({ page, snippet }) => (
                          <div
                            key={page.id}
                            onClick={() => handleSelectPage(page.id)}
                            className="p-3 rounded-xl border border-gray-200 dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#202020] hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-1.5 font-semibold text-xs text-[#37352f] dark:text-[#ebebeb] group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              <span>{page.icon || '📄'}</span>
                              <span className="truncate">{page.title || t('untitled', language)}</span>
                            </div>
                            {snippet && (
                              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 italic">
                                "{snippet}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Click to add new block at bottom */}
                  <div
                    onClick={() => {
                      if (activePage.blocks.length > 0) {
                        handleAddBlockBelow(activePage.blocks[activePage.blocks.length - 1].id);
                      }
                    }}
                    className="py-12 cursor-text text-gray-400 text-xs flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('clickToAddBlock', language)}</span>
                  </div>
                </div>
              )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <p className="text-sm">{t('noPageSelected', language)}</p>
            <button
              onClick={() => handleAddPage(null)}
              className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {t('createNewPage', language)}
            </button>
          </div>
        )}
      </main>

      {/* Floating Selection Formatting Bar */}
      <FloatingToolbar language={language} />

      {/* Starter Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        language={language}
        onClose={() => setIsTemplatesOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* Slash Menu Popup */}
      <SlashMenu
        isOpen={slashMenuState.isOpen}
        language={language}
        onClose={() => setSlashMenuState((prev) => ({ ...prev, isOpen: false }))}
        onSelect={handleSelectSlashItem}
        query={slashMenuState.query}
        position={slashMenuState.position}
      />

      {/* Global Quick Switcher / Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        pages={currentWorkspace?.pages || {}}
        theme={workspaceState.theme}
        language={language}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectPage={handleSelectPage}
        onAddPage={() => handleAddPage(null)}
        onToggleTheme={handleToggleTheme}
        onSelectTheme={handleSelectTheme}
        onToggleLanguage={handleToggleLanguage}
        onExportWorkspace={handleExportWorkspace}
      />

      {/* Trash Modal */}
      <TrashModal
        isOpen={isTrashOpen}
        pages={currentWorkspace?.pages || {}}
        language={language}
        onClose={() => setIsTrashOpen(false)}
        onRestorePage={handleRestorePage}
        onPermanentDeletePage={handlePermanentDeletePage}
      />

      {/* Visual Interactive Knowledge Graph (Obsidian-Style) */}
      <GraphView
        isOpen={isGraphViewOpen}
        pages={currentWorkspace?.pages || {}}
        activePageId={currentWorkspace?.activePageId || ''}
        theme={workspaceState.theme}
        language={language}
        onClose={() => setIsGraphViewOpen(false)}
        onSelectPage={handleSelectPage}
      />

      {/* AES-256 Vault / Lock Modal */}
      {activePage && (
        <LockModal
          isOpen={isLockModalOpen}
          page={activePage}
          language={language}
          onClose={() => setIsLockModalOpen(false)}
          onPageLocked={(updated) => handleUpdatePage(updated)}
          onPageUnlocked={handlePageUnlocked}
        />
      )}

      {/* Sticky Document Outline Drawer */}
      {activePage && (
        <OutlineDrawer
          isOpen={isOutlineOpen}
          page={activePage}
          language={language}
          onClose={() => setIsOutlineOpen(false)}
        />
      )}
    </div>
  );
}
export default App;
