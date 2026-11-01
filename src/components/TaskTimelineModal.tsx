import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, Calendar, Download, X, Search, Filter, Check, Clock, 
  ArrowRight, ExternalLink, Sparkles, BarChart2, Layers
} from 'lucide-react';
import { Workspace, Page, Block } from '../types';
import { t, Language } from '../i18n';

export interface WorkspaceTask {
  id: string;
  pageId: string;
  pageTitle: string;
  pageIcon: string;
  content: string;
  completed: boolean;
  blockId: string;
  dueDate?: string;
}

interface TaskTimelineModalProps {
  isOpen: boolean;
  workspace: Workspace;
  language?: Language;
  onClose: () => void;
  onSelectPage: (pageId: string) => void;
  onToggleTask: (pageId: string, blockId: string, completed: boolean) => void;
}

export const TaskTimelineModal: React.FC<TaskTimelineModalProps> = ({
  isOpen,
  workspace,
  language = 'en',
  onClose,
  onSelectPage,
  onToggleTask,
}) => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'gantt'>('agenda');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all tasks across all pages in the workspace
  const allTasks = useMemo(() => {
    const list: WorkspaceTask[] = [];

    for (const page of Object.values(workspace.pages)) {
      if (page.isArchived) continue;

      for (const block of page.blocks) {
        if (block.type === 'todo') {
          // Check for date pattern in task text e.g. @2026-11-05 or due:YYYY-MM-DD
          const cleanText = block.content.replace(/<[^>]*>/g, '').trim();
          const dateMatch = cleanText.match(/@(\d{4}-\d{2}-\d{2})|due:?\s*(\d{4}-\d{2}-\d{2})/i);
          const dueDate = dateMatch ? dateMatch[1] || dateMatch[2] : undefined;

          list.push({
            id: `${page.id}-${block.id}`,
            pageId: page.id,
            pageTitle: page.title || 'Untitled',
            pageIcon: page.icon || '📄',
            content: cleanText,
            completed: !!block.checked,
            blockId: block.id,
            dueDate,
          });
        }
      }
    }

    return list;
  }, [workspace]);

  if (!isOpen) return null;

  // Filter tasks
  const filteredTasks = allTasks.filter((t) => {
    if (filterStatus === 'open' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.content.toLowerCase().includes(q) || t.pageTitle.toLowerCase().includes(q);
    }
    return true;
  });

  const totalCount = allTasks.length;
  const completedCount = allTasks.filter((t) => t.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Export tasks as RFC 5545 iCalendar (.ics) file
  const handleExportICS = () => {
    let ics = `BEGIN:VCALENDAR\r\n`;
    ics += `VERSION:2.0\r\n`;
    ics += `PRODID:-//Nota Workspace//Task Aggregator v1.1.0//EN\r\n`;
    ics += `CALSCALE:GREGORIAN\r\n`;
    ics += `METHOD:PUBLISH\r\n`;
    ics += `X-WR-CALNAME:Nota Workspace Tasks\r\n\r\n`;

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    allTasks.forEach((task, idx) => {
      let dtStart = now;
      if (task.dueDate) {
        dtStart = task.dueDate.replace(/-/g, '') + 'T090000Z';
      }

      ics += `BEGIN:VEVENT\r\n`;
      ics += `UID:nota-task-${task.blockId}@nota.local\r\n`;
      ics += `DTSTAMP:${now}\r\n`;
      ics += `DTSTART:${dtStart}\r\n`;
      ics += `SUMMARY:${task.content.slice(0, 80)}\r\n`;
      ics += `DESCRIPTION:From page "${task.pageTitle}" in Nota workspace\r\n`;
      ics += `STATUS:${task.completed ? 'COMPLETED' : 'NEEDS-ACTION'}\r\n`;
      ics += `END:VEVENT\r\n`;
    });

    ics += `END:VCALENDAR\r\n`;

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nota-tasks-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2e2e2e] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2e2e2e]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {language === 'ar' ? 'أجندة المهام والمخطط الزمني' : 'Global Tasks & Timeline'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                  {completedCount}/{totalCount} ({progressPercent}%)
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'ar'
                  ? 'جميع مهام الملاحظات مجمعة في مكان واحد مع تصدير للتقويم'
                  : 'Cross-vault action items aggregated with RFC 5545 calendar export'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportICS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
              title="Export all tasks as RFC 5545 iCalendar .ics file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تصدير التقويم (.ics)' : 'Export .ics'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Filter Bar */}
        <div className="px-6 py-3 bg-[#fbfbfa] dark:bg-[#202020] border-b border-gray-200 dark:border-[#2e2e2e] space-y-3">
          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-[#333333] h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Controls: Search + Tabs + Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1 bg-white dark:bg-[#1a1a1a] p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'agenda'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'قائمة الأجندة' : 'Agenda View'}</span>
              </button>
              <button
                onClick={() => setActiveTab('gantt')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'gantt'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'المخطط الزمني' : 'Timeline / Gantt'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 rtl:left-auto rtl:right-2.5 pointer-events-none" />
                <input
                  type="text"
                  dir="auto"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'تصفية المهام...' : 'Filter tasks...'}
                  className="pl-8 rtl:pl-2 rtl:pr-8 pr-2 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-md text-xs w-36 focus:w-48 transition-all focus:outline-none"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] p-0.5">
                {(['all', 'open', 'completed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors cursor-pointer ${
                      filterStatus === status
                        ? 'bg-gray-100 dark:bg-[#333333] text-gray-900 dark:text-white'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {status === 'all'
                      ? language === 'ar' ? 'الكل' : 'All'
                      : status === 'open'
                      ? language === 'ar' ? 'مفتوحة' : 'Open'
                      : language === 'ar' ? 'مكتملة' : 'Done'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Task List or Gantt View Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">
                {language === 'ar' ? 'لا توجد مهام تطابق البحث' : 'No tasks found'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar'
                  ? 'اكتب [] في أي صفحة لإنشاء مهمة جديدة'
                  : 'Type [] on any note to create a new action item.'}
              </p>
            </div>
          ) : activeTab === 'agenda' ? (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                  task.completed
                    ? 'bg-gray-50 dark:bg-[#202020]/60 border-gray-200 dark:border-[#2e2e2e] opacity-75'
                    : 'bg-white dark:bg-[#222222] border-gray-200 dark:border-[#333333] shadow-xs hover:border-indigo-400'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => onToggleTask(task.pageId, task.blockId, e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      dir="auto"
                      className={`text-xs block break-words ${
                        task.completed
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : 'text-gray-800 dark:text-gray-100 font-medium'
                      }`}
                    >
                      {task.content}
                    </span>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <button
                        onClick={() => {
                          onSelectPage(task.pageId);
                          onClose();
                        }}
                        className="hover:text-indigo-500 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                      >
                        <span>{task.pageIcon}</span>
                        <span className="truncate max-w-[140px]">{task.pageTitle}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </button>

                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{task.dueDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Gantt / Timeline Visualization */
            <div className="space-y-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {language === 'ar'
                  ? 'مخطط تقدم المهام موزعة حسب المستندات ومعدل الإنجاز:'
                  : 'Document completion breakdown and visual progress schedule:'}
              </div>

              {Object.values(workspace.pages)
                .filter((p) => !p.isArchived)
                .map((page) => {
                  const pageTasks = allTasks.filter((t) => t.pageId === page.id);
                  if (pageTasks.length === 0) return null;

                  const done = pageTasks.filter((t) => t.completed).length;
                  const pct = Math.round((done / pageTasks.length) * 100);

                  return (
                    <div
                      key={page.id}
                      className="p-3.5 rounded-xl border border-gray-200 dark:border-[#2e2e2e] bg-white dark:bg-[#202020] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <button
                          onClick={() => {
                            onSelectPage(page.id);
                            onClose();
                          }}
                          className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white hover:text-indigo-500 transition-colors cursor-pointer"
                        >
                          <span>{page.icon || '📄'}</span>
                          <span>{page.title}</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            ({done}/{pageTasks.length})
                          </span>
                        </button>
                        <span className="font-mono text-xs font-bold text-indigo-500">{pct}%</span>
                      </div>

                      {/* Visual Gantt Bar */}
                      <div className="w-full bg-gray-100 dark:bg-[#2b2b2b] h-3 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-300 ${
                            pct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
