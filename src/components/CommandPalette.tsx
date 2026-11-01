import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Plus, Moon, Sun, Download, X, Languages, Palette } from 'lucide-react';
import { Page, AppTheme } from '../types';
import { t, Language } from '../i18n';

interface CommandPaletteProps {
  isOpen: boolean;
  pages: Record<string, Page>;
  theme: AppTheme;
  language?: Language;
  onClose: () => void;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onToggleTheme: () => void;
  onSelectTheme?: (theme: AppTheme) => void;
  onToggleLanguage?: () => void;
  onExportWorkspace: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  pages,
  theme,
  language = 'en',
  onClose,
  onSelectPage,
  onAddPage,
  onToggleTheme,
  onSelectTheme,
  onToggleLanguage,
  onExportWorkspace,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter pages and content
  const filteredPages = Object.values(pages)
    .filter((p) => !p.isArchived)
    .filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(query.toLowerCase());
      const matchBlocks = p.blocks.some((b) =>
        b.content.toLowerCase().includes(query.toLowerCase())
      );
      return matchTitle || matchBlocks;
    });

  const actions = [
    {
      id: 'action-new',
      label: t('createNewPage', language),
      icon: <Plus className="w-4 h-4 text-green-500" />,
      run: () => {
        onAddPage();
        onClose();
      },
    },
    {
      id: 'action-language',
      label: language === 'ar' ? 'التبديل إلى الإنجليزية (English)' : 'التبديل إلى العربية (Arabic)',
      icon: <Languages className="w-4 h-4 text-sky-500" />,
      run: () => {
        onToggleLanguage?.();
        onClose();
      },
    },
    {
      id: 'action-theme-dark',
      label: `${t('theme', language)}: ${t('themeDark', language)}`,
      icon: <Moon className="w-4 h-4 text-blue-400" />,
      run: () => {
        onSelectTheme ? onSelectTheme('dark') : onToggleTheme();
        onClose();
      },
    },
    {
      id: 'action-theme-oled',
      label: `${t('theme', language)}: ${t('themeOled', language)}`,
      icon: <span className="w-4 h-4 flex items-center justify-center text-xs">🖤</span>,
      run: () => {
        onSelectTheme ? onSelectTheme('oled') : onToggleTheme();
        onClose();
      },
    },
    {
      id: 'action-theme-catppuccin',
      label: `${t('theme', language)}: ${t('themeCatppuccin', language)}`,
      icon: <span className="w-4 h-4 flex items-center justify-center text-xs">🍧</span>,
      run: () => {
        onSelectTheme ? onSelectTheme('catppuccin') : onToggleTheme();
        onClose();
      },
    },
    {
      id: 'action-theme-nord',
      label: `${t('theme', language)}: ${t('themeNord', language)}`,
      icon: <span className="w-4 h-4 flex items-center justify-center text-xs">❄️</span>,
      run: () => {
        onSelectTheme ? onSelectTheme('nord') : onToggleTheme();
        onClose();
      },
    },
    {
      id: 'action-theme-sepia',
      label: `${t('theme', language)}: ${t('themeSepia', language)}`,
      icon: <span className="w-4 h-4 flex items-center justify-center text-xs">📜</span>,
      run: () => {
        onSelectTheme ? onSelectTheme('sepia') : onToggleTheme();
        onClose();
      },
    },
    {
      id: 'action-theme-light',
      label: `${t('theme', language)}: ${t('themeLight', language)}`,
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      run: () => {
        onSelectTheme ? onSelectTheme('light') : onToggleTheme();
        onClose();
      },
    },
    {
      id: 'action-export',
      label: t('exportEntireWorkspace', language),
      icon: <Download className="w-4 h-4 text-indigo-500" />,
      run: () => {
        onExportWorkspace();
        onClose();
      },
    },
  ];

  const allItems = [
    ...filteredPages.map((p) => ({
      type: 'page',
      id: p.id,
      label: p.title || t('untitled', language),
      icon: p.icon || '📄',
      subtext: p.blocks[0]?.content ? p.blocks[0].content.slice(0, 60).replace(/<[^>]*>/g, '') : '',
      run: () => {
        onSelectPage(p.id);
        onClose();
      },
    })),
    ...actions.map((a) => ({
      type: 'action',
      id: a.id,
      label: a.label,
      icon: a.icon,
      subtext: t('quickActions', language),
      run: a.run,
    })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].run();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-24 px-4 animate-in fade-in duration-100">
      <div className="w-full max-w-xl bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2e2e2e] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            dir="auto"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('searchPagesCommands', language)}
            className="flex-1 bg-transparent text-sm focus:outline-none text-[#37352f] dark:text-[#ebebeb] placeholder-gray-400"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">{t('noResultsFound', language)}</div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.run}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#efefee] dark:bg-[#323232] text-[#37352f] dark:text-[#ffffff]'
                      : 'hover:bg-[#f5f5f4] dark:hover:bg-[#2a2a2a] text-[#37352f] dark:text-[#ebebeb]'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center text-sm shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div dir="auto" className="text-xs font-medium truncate">{item.label}</div>
                    {item.subtext && (
                      <div dir="auto" className="text-[11px] text-gray-400 truncate">{item.subtext}</div>
                    )}
                  </div>
                  {isSelected && (
                    <kbd className="text-[10px] bg-gray-200 dark:bg-[#404040] text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded font-mono">
                      ↵
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts tip */}
        <div className="px-4 py-2 border-t border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#202020] text-[11px] text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <kbd className="bg-gray-200 dark:bg-[#323232] px-1 py-0.5 rounded font-mono">↑</kbd>
            <kbd className="bg-gray-200 dark:bg-[#323232] px-1 py-0.5 rounded font-mono">↓</kbd>
            <span>{t('navigate', language)}</span>
            <span className="mx-1">•</span>
            <kbd className="bg-gray-200 dark:bg-[#323232] px-1 py-0.5 rounded font-mono">Enter</kbd>
            <span>{t('select', language)}</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-mono">Nota v1.0.1</span>
        </div>
      </div>
    </div>
  );
};
