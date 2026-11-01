import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, Star, FileText, ChevronRight, ChevronDown, 
  Trash2, Moon, Sun, Download, Upload, Cpu, MoreHorizontal, Copy,
  Check, Edit3, Smile, X, Layers, Briefcase, Layout, Languages,
  Calendar, CalendarDays, ChevronLeft, Network
} from 'lucide-react';
import { Page, Workspace, AppTheme } from '../types';
import { t, Language } from '../i18n';

interface SidebarProps {
  workspaces: Record<string, Workspace>;
  activeWorkspaceId: string;
  pages: Record<string, Page>;
  activePageId: string;
  isOpen: boolean;
  theme: AppTheme;
  language: Language;
  onSelectPage: (id: string) => void;
  onAddPage: (parentId?: string | null) => void;
  onDeletePage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onOpenSearch: () => void;
  onOpenTrash: () => void;
  onOpenTemplates: () => void;
  onOpenGraphView?: () => void;
  onOpenDailyNote?: () => void;
  onSelectDate?: (dateStr: string) => void;
  onExportWorkspace: () => void;
  onImportWorkspace: (json: string) => void;
  onCloseSidebar: () => void;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, icon: string) => void;
  onRenameWorkspace: (id: string, newName: string) => void;
  onChangeWorkspaceIcon: (id: string, newIcon: string) => void;
  onDeleteWorkspace: (id: string) => void;
}

const WORKSPACE_ICONS = ['🚀', '💼', '🧠', '💻', '🎯', '✨', '🔥', '📚', '🎨', '⚡', '💡', '🏷️', '📝', '🌟', '🛠️', '☕'];

export const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  activeWorkspaceId,
  pages,
  activePageId,
  isOpen,
  theme,
  language,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onToggleFavorite,
  onToggleTheme,
  onToggleLanguage,
  onOpenSearch,
  onOpenTrash,
  onOpenTemplates,
  onOpenGraphView,
  onOpenDailyNote,
  onSelectDate,
  onExportWorkspace,
  onImportWorkspace,
  onCloseSidebar,
  onSelectWorkspace,
  onCreateWorkspace,
  onRenameWorkspace,
  onChangeWorkspaceIcon,
  onDeleteWorkspace,
}) => {
  const [collapsedPages, setCollapsedPages] = useState<Record<string, boolean>>({});
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsIcon, setNewWsIcon] = useState('💼');
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editingWsName, setEditingWsName] = useState('');
  const [iconPickerWsId, setIconPickerWsId] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  
  const wsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(e.target as Node)) {
        setIsWorkspaceMenuOpen(false);
        setIsCreatingWorkspace(false);
        setEditingWsId(null);
        setIconPickerWsId(null);
      }
    }
    if (isWorkspaceMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWorkspaceMenuOpen]);

  if (!isOpen) return null;

  const currentWorkspace = workspaces[activeWorkspaceId] || Object.values(workspaces)[0];
  const allWorkspaces = Object.values(workspaces);

  const allActivePages = Object.values(pages).filter((p) => !p.isArchived);
  const favoritePages = allActivePages.filter((p) => p.isFavorite);
  const rootPages = allActivePages.filter((p) => !p.parentId);

  const togglePageCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedPages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) onImportWorkspace(content);
      };
      reader.readAsText(file);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    onCreateWorkspace(newWsName.trim(), newWsIcon);
    setNewWsName('');
    setIsCreatingWorkspace(false);
  };

  const handleRenameSubmit = (wsId: string) => {
    if (!editingWsName.trim()) return;
    onRenameWorkspace(wsId, editingWsName.trim());
    setEditingWsId(null);
  };

  // Recursive Tree Item Renderer
  const renderPageItem = (page: Page, depth = 0) => {
    const childPages = allActivePages.filter((p) => p.parentId === page.id);
    const hasChildren = childPages.length > 0;
    const isExpanded = !collapsedPages[page.id];

    return (
      <div key={page.id} className="relative group/page">
        <div
          onClick={() => {
            onSelectPage(page.id);
            if (window.innerWidth < 768) onCloseSidebar();
          }}
          style={{ paddingInlineStart: `${depth * 14 + 8}px` }}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors ${
            activePageId === page.id
              ? 'bg-[#e8e8e6] dark:bg-[#323232] font-medium'
              : 'hover:bg-[#efefee] dark:hover:bg-[#2c2c2c]'
          }`}
        >
          {/* Collapse/Expand chevron if has children or spacer */}
          {hasChildren ? (
            <button
              onClick={(e) => togglePageCollapse(page.id, e)}
              className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-[#404040] text-gray-400"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : 'rtl:rotate-180'}`}
              />
            </button>
          ) : (
            <span className="w-3" />
          )}

          <span className="text-sm select-none">{page.icon || '📄'}</span>
          <span dir="auto" className="truncate flex-1 text-xs text-[#37352f] dark:text-[#ebebeb]">
            {page.title || t('untitled', language)}
          </span>

          {/* Actions on hover */}
          <div className="opacity-0 group-hover/page:opacity-100 flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddPage(page.id);
                setCollapsedPages((prev) => ({ ...prev, [page.id]: false }));
              }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#383838] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title={t('createNewPage', language)}
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeletePage(page.id);
              }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#383838] text-gray-400 hover:text-red-500"
              title={t('delete', language)}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Child Pages Container */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {childPages.map((child) => renderPageItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onCloseSidebar}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
      />

      <aside className="fixed md:static inset-y-0 start-0 z-50 w-72 md:w-64 h-screen bg-[#fbfbfa] dark:bg-[#202020] border-r rtl:border-l rtl:border-r-0 border-[#e9e9e7] dark:border-[#2e2e2e] flex flex-col justify-between shrink-0 select-none text-xs text-[#37352f] dark:text-[#ebebeb] shadow-2xl md:shadow-none transition-all duration-200">
        {/* Top Section */}
        <div className="flex-1 overflow-y-auto">
          {/* Workspace Switcher Header */}
          <div className="relative p-2 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
            <button
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] transition-colors group text-start cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base select-none">{currentWorkspace?.icon || '🚀'}</span>
                <span className="font-semibold text-sm truncate max-w-[130px] text-[#37352f] dark:text-[#ebebeb]">
                  {currentWorkspace?.name || t('workspace', language)}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-transform ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseSidebar();
                  }}
                  className="md:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#333] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                  title="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </button>

          {/* Workspaces Popover Menu - Cleanly bounds within sidebar */}
          {isWorkspaceMenuOpen && (
            <div
              ref={wsDropdownRef}
              className="absolute left-2 rtl:left-auto rtl:right-2 top-13 z-50 w-[240px] bg-white dark:bg-[#242424] border border-[#e2e2e0] dark:border-[#383838] rounded-xl shadow-2xl p-2.5 animate-in fade-in zoom-in-95"
            >
              <div className="px-1 pb-1.5 flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-[#333333]">
                <span>{t('workspaces', language)}</span>
                <span className="text-[10px] text-emerald-500 font-mono font-medium">30MB RAM</span>
              </div>

              {/* Workspace List */}
              <div className="mt-1.5 space-y-1.5 max-h-56 overflow-y-auto">
                {allWorkspaces.map((ws) => {
                  const isActive = ws.id === activeWorkspaceId;
                  const isEditing = editingWsId === ws.id;

                  return (
                    <div
                      key={ws.id}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isActive
                          ? 'bg-[#f0f0ef] dark:bg-[#2f2f2f] border-gray-300 dark:border-[#444444]'
                          : 'bg-transparent border-transparent hover:bg-[#f7f7f6] dark:hover:bg-[#2a2a2a]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div
                          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (!isEditing && iconPickerWsId !== ws.id) {
                              onSelectWorkspace(ws.id);
                              setIsWorkspaceMenuOpen(false);
                            }
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIconPickerWsId(iconPickerWsId === ws.id ? null : ws.id);
                            }}
                            className="hover:scale-110 active:scale-95 transition-transform text-sm select-none p-1 rounded bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#3a3a3a] shadow-2xs"
                            title="Click to change icon"
                          >
                            {ws.icon || '🚀'}
                          </button>

                          {isEditing ? (
                            <input
                              type="text"
                              value={editingWsName}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditingWsName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit(ws.id);
                                if (e.key === 'Escape') setEditingWsId(null);
                              }}
                              className="w-full bg-white dark:bg-[#1a1a1a] border border-blue-500 rounded px-1.5 py-0.5 text-xs text-[#37352f] dark:text-[#ebebeb] focus:outline-none"
                            />
                          ) : (
                            <span dir="auto" className="text-xs font-medium truncate text-[#37352f] dark:text-[#ebebeb]">
                              {ws.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          {isEditing ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameSubmit(ws.id);
                              }}
                              className="p-1 rounded text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Save name"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingWsId(ws.id);
                                setEditingWsName(ws.name);
                              }}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3d3d3d] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              title="Rename workspace"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}

                          {allWorkspaces.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete workspace "${ws.name}"?`)) {
                                  onDeleteWorkspace(ws.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3d3d3d] text-gray-400 hover:text-red-500"
                              title="Delete workspace"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {iconPickerWsId === ws.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 p-2 border border-gray-200 dark:border-[#383838] bg-white dark:bg-[#1c1c1c] rounded-lg shadow-sm"
                        >
                          <div className="text-[10px] font-semibold text-gray-400 mb-1">Pick Icon:</div>
                          <div className="grid grid-cols-6 gap-1 text-sm">
                            {WORKSPACE_ICONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  onChangeWorkspaceIcon(ws.id, emoji);
                                  setIconPickerWsId(null);
                                }}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#333333] hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isCreatingWorkspace ? (
                <form onSubmit={handleCreateSubmit} className="mt-2 pt-2 border-t border-gray-100 dark:border-[#333333]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <select
                      value={newWsIcon}
                      onChange={(e) => setNewWsIcon(e.target.value)}
                      className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#444] text-sm p-1 rounded focus:outline-none cursor-pointer"
                    >
                      {WORKSPACE_ICONS.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      autoFocus
                      dir="auto"
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      placeholder={t('workspaceName', language)}
                      className="flex-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#444] rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-[#37352f] dark:text-[#ebebeb]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
                    >
                      {t('create', language)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingWorkspace(false)}
                      className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-[#333333] text-gray-500 text-xs cursor-pointer"
                    >
                      {t('cancel', language)}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingWorkspace(true)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-[#444] hover:bg-[#f0f0ef] dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('newWorkspace', language)}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Global Quick Action Buttons */}
        <div className="px-2 pt-2 space-y-0.5">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <span>{t('search', language)}</span>
            </div>
            <kbd className="text-[10px] bg-gray-200/60 dark:bg-[#323232] px-1 py-0.5 rounded text-gray-500 font-mono">
              Ctrl+K
            </kbd>
          </button>

          <button
            onClick={() => onAddPage(null)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-gray-400" />
            <span>{t('createNewPage', language)}</span>
          </button>

          <button
            onClick={onOpenTemplates}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
          >
            <Layout className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('templates', language)}</span>
          </button>

          {/* Interactive Knowledge Graph */}
          <button
            onClick={onOpenGraphView}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
          >
            <Network className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('graphView', language)}</span>
          </button>

          {/* Daily Note & Mini-Calendar Quick Action */}
          <button
            onClick={onOpenDailyNote}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('dailyNote', language)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40">
                {t('today', language)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCalendarOpen(!isCalendarOpen);
                }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-[#383838] rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title={t('calendar', language)}
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </button>

          {/* Expandable Mini-Calendar */}
          {isCalendarOpen && (
            <div className="p-2.5 my-1 rounded-xl bg-white dark:bg-[#202020] border border-gray-200 dark:border-[#2e2e2e] shadow-xs text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                    else { setCalMonth(calMonth - 1); }
                  }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#2c2c2c] text-gray-500"
                >
                  <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
                <span className="font-semibold text-gray-800 dark:text-gray-200 text-[11px]">
                  {language === 'ar'
                    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][calMonth]
                    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][calMonth]}{' '}
                  {calYear}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                    else { setCalMonth(calMonth + 1); }
                  }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#2c2c2c] text-gray-500"
                >
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>

              {/* Day header row */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-gray-400 mb-1">
                {(language === 'ar' ? ['أ', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']).map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                  const d = i + 1;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const isToday = dateStr === new Date().toISOString().slice(0, 10);
                  const hasNote = Object.values(pages).some(
                    (p) => !p.isArchived && (p.dateString === dateStr || (p.title && p.title.includes(dateStr)))
                  );

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => onSelectDate?.(dateStr)}
                      className={`relative p-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer flex flex-col items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'hover:bg-gray-100 dark:hover:bg-[#2c2c2c] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{d}</span>
                      {hasNote && (
                        <span
                          className={`w-1 h-1 rounded-full ${
                            isToday ? 'bg-amber-300' : 'bg-indigo-500'
                          } -mt-0.5`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Favorites Section */}
        {favoritePages.length > 0 && (
          <div className="mt-4 px-2">
            <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{t('favorites', language)}</span>
            </div>
            <div className="space-y-0.5 mt-0.5">
              {favoritePages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    activePageId === page.id
                      ? 'bg-[#e8e8e6] dark:bg-[#323232] font-medium'
                      : 'hover:bg-[#efefee] dark:hover:bg-[#2c2c2c]'
                  }`}
                >
                  <span>{page.icon || '📄'}</span>
                  <span dir="auto" className="truncate flex-1">{page.title || t('untitled', language)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hierarchical Page Tree */}
        <div className="mt-4 px-2">
          <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <span>{t('pages', language)}</span>
            <button
              onClick={() => onAddPage(null)}
              className="p-0.5 rounded hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              title={t('createNewPage', language)}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-0.5 mt-0.5">
            {rootPages.map((page) => renderPageItem(page, 0))}
          </div>
        </div>
      </div>

      {/* Bottom Footer Controls */}
      <div className="p-2 border-t border-[#e9e9e7] dark:border-[#2e2e2e] space-y-1">
        {/* Language Switcher */}
        <button
          onClick={onToggleLanguage}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
          title="Toggle English / العربية"
        >
          <div className="flex items-center gap-2">
            <Languages className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('language', language)}</span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300">
            {language === 'ar' ? 'العربية' : 'English'}
          </span>
        </button>

        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
          title="Cycle Theme (Dark, OLED, Catppuccin, Nord, Sepia, Light)"
        >
          <div className="flex items-center gap-2">
            {theme === 'oled' ? (
              <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">🖤</span>
            ) : theme === 'catppuccin' ? (
              <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">🍧</span>
            ) : theme === 'nord' ? (
              <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">❄️</span>
            ) : theme === 'sepia' ? (
              <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">📜</span>
            ) : theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{t('theme', language)}</span>
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            {theme === 'oled'
              ? t('themeOled', language)
              : theme === 'catppuccin'
              ? t('themeCatppuccin', language)
              : theme === 'nord'
              ? t('themeNord', language)
              : theme === 'sepia'
              ? t('themeSepia', language)
              : theme === 'light'
              ? t('themeLight', language)
              : t('themeDark', language)}
          </span>
        </button>

        <button
          onClick={onOpenTrash}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-gray-400" />
          <span>{t('trashAndArchive', language)}</span>
        </button>

        <div className="flex items-center gap-1 pt-1 border-t border-[#e9e9e7] dark:border-[#2e2e2e]">
          <button
            onClick={onExportWorkspace}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer"
            title={t('exportWorkspace', language)}
          >
            <Download className="w-3 h-3" /> {t('export', language)}
          </button>
          <label className="flex-1 flex items-center justify-center gap-1 py-1 rounded hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer">
            <Upload className="w-3 h-3" /> {t('import', language)}
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>
        </div>
      </div>
    </aside>
  </>
  );
};
