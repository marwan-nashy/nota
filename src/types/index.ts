export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bullet'
  | 'number'
  | 'toggle'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'code'
  | 'math'
  | 'diagram'
  | 'toc'
  | 'image'
  | 'database'
  | 'page_link';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  language?: string;
  icon?: string;
  color?: string;
  isOpen?: boolean;
  imageUrl?: string;
  caption?: string;
  databaseId?: string;
  targetPageId?: string;
}

export type DatabaseViewType = 'table' | 'board' | 'gallery' | 'list';

export type AppTheme = 'light' | 'dark' | 'oled' | 'catppuccin' | 'nord' | 'sepia';

export type ColumnType = 'title' | 'text' | 'select' | 'status' | 'checkbox' | 'date';

export interface DatabaseColumn {
  id: string;
  name: string;
  type: ColumnType;
  options?: { id: string; label: string; color: string }[];
}

export interface DatabaseRow {
  id: string;
  pageId?: string;
  cells: Record<string, any>;
}

export interface Database {
  id: string;
  title: string;
  view: DatabaseViewType;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
}

export interface Page {
  id: string;
  parentId: string | null;
  title: string;
  icon: string;
  cover: string | null;
  blocks: Block[];
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  font: 'sans' | 'serif' | 'mono';
  fullWidth: boolean;
  smallText: boolean;
  isLocked?: boolean;
  encryptedData?: string;
  salt?: string;
  iv?: string;
  isDailyNote?: boolean;
  dateString?: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  pages: Record<string, Page>;
  databases: Record<string, Database>;
  activePageId: string;
  createdAt: number;
}

export interface FeatureFlags {
  graph: boolean;
  diagrams: boolean;
  math: boolean;
  dailyNotes: boolean;
  backlinks: boolean;
  vault: boolean;
  toc: boolean;
  databases: boolean;
  templates: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  graph: true,
  diagrams: true,
  math: true,
  dailyNotes: true,
  backlinks: true,
  vault: true,
  toc: true,
  databases: true,
  templates: true,
};

export interface WorkspaceState {
  workspaces: Record<string, Workspace>;
  activeWorkspaceId: string;
  sidebarOpen: boolean;
  theme: AppTheme;
  language?: 'en' | 'ar';
  features?: FeatureFlags;
}
