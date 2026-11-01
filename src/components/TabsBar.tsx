import React from 'react';
import { X, Plus, FileText } from 'lucide-react';
import { Page } from '../types';
import { t, Language } from '../i18n';

interface TabsBarProps {
  openTabIds: string[];
  activePageId: string;
  pages: Record<string, Page>;
  language?: Language;
  onSelectTab: (pageId: string) => void;
  onCloseTab: (pageId: string) => void;
  onNewTab: () => void;
}

export const TabsBar: React.FC<TabsBarProps> = ({
  openTabIds,
  activePageId,
  pages,
  language = 'en',
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  // Filter out any deleted or archived tabs
  const validTabs = openTabIds.filter((id) => pages[id] && !pages[id].isArchived);

  if (validTabs.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 px-3 pt-1.5 border-b border-gray-200/80 dark:border-[#282828] bg-gray-50/50 dark:bg-[#161616]/70 overflow-x-auto no-scrollbar select-none">
      {validTabs.map((id) => {
        const page = pages[id];
        const isActive = id === activePageId;

        return (
          <div
            key={id}
            onClick={() => onSelectTab(id)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                // Middle click closes tab
                e.preventDefault();
                onCloseTab(id);
              }
            }}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg border-t border-x text-xs font-medium cursor-pointer transition-all max-w-[200px] shrink-0 ${
              isActive
                ? 'bg-white dark:bg-[#191919] border-gray-200/90 dark:border-[#2e2e2e] text-indigo-600 dark:text-indigo-400 shadow-xs z-10'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-[#202020]'
            }`}
          >
            <span className="text-sm shrink-0">{page.icon || '📄'}</span>
            <span className="truncate flex-1">{page.title || t('untitled', language)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(id);
              }}
              title={t('closeTab', language)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-[#333] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      <button
        onClick={onNewTab}
        title={t('createNewPage', language)}
        className="p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-[#252525] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-1 cursor-pointer shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
