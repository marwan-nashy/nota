import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Type, Heading1, Heading2, Heading3, CheckSquare, List, ListOrdered, 
  ChevronRight, Quote, Minus, AlertCircle, Code, Table, Kanban,
  Image as ImageIcon, FileText, Sparkles, ListTree, Workflow
} from 'lucide-react';
import { BlockType, FeatureFlags } from '../types';
import { t, Language } from '../i18n';

interface SlashMenuProps {
  isOpen: boolean;
  language?: Language;
  features?: FeatureFlags;
  onClose: () => void;
  onSelect: (type: BlockType, extra?: any) => void;
  query: string;
  position: { top: number; left: number };
}

interface MenuItem {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  extra?: any;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  isOpen,
  language = 'en',
  features,
  onClose,
  onSelect,
  query,
  position,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = useMemo<MenuItem[]>(() => [
    {
      type: 'paragraph',
      label: t('blockText', language),
      description: t('blockTextDesc', language),
      icon: <Type className="w-4 h-4 text-gray-500" />,
      category: t('catBasic', language),
    },
    {
      type: 'heading1',
      label: t('blockHeading1', language),
      description: t('blockHeading1Desc', language),
      icon: <Heading1 className="w-4 h-4 text-blue-500" />,
      category: t('catBasic', language),
    },
    {
      type: 'heading2',
      label: t('blockHeading2', language),
      description: t('blockHeading2Desc', language),
      icon: <Heading2 className="w-4 h-4 text-blue-500" />,
      category: t('catBasic', language),
    },
    {
      type: 'heading3',
      label: t('blockHeading3', language),
      description: t('blockHeading3Desc', language),
      icon: <Heading3 className="w-4 h-4 text-blue-500" />,
      category: t('catBasic', language),
    },
    {
      type: 'todo',
      label: t('blockTodo', language),
      description: t('blockTodoDesc', language),
      icon: <CheckSquare className="w-4 h-4 text-green-500" />,
      category: t('catLists', language),
    },
    {
      type: 'bullet',
      label: t('blockBullet', language),
      description: t('blockBulletDesc', language),
      icon: <List className="w-4 h-4 text-orange-500" />,
      category: t('catLists', language),
    },
    {
      type: 'number',
      label: t('blockNumber', language),
      description: t('blockNumberDesc', language),
      icon: <ListOrdered className="w-4 h-4 text-yellow-500" />,
      category: t('catLists', language),
    },
    {
      type: 'toggle',
      label: t('blockToggle', language),
      description: t('blockToggleDesc', language),
      icon: <ChevronRight className="w-4 h-4 text-gray-500" />,
      category: t('catLists', language),
    },
    {
      type: 'page_link',
      label: t('blockSubpage', language),
      description: t('blockSubpageDesc', language),
      icon: <FileText className="w-4 h-4 text-indigo-500" />,
      category: t('catBasic', language),
    },
    {
      type: 'image',
      label: t('blockImage', language),
      description: t('blockImageDesc', language),
      icon: <ImageIcon className="w-4 h-4 text-rose-500" />,
      category: t('catMedia', language),
    },
    {
      type: 'callout',
      label: t('blockCallout', language),
      description: t('blockCalloutDesc', language),
      icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
      category: t('catAdvanced', language),
    },
    {
      type: 'quote',
      label: t('blockQuote', language),
      description: t('blockQuoteDesc', language),
      icon: <Quote className="w-4 h-4 text-purple-500" />,
      category: t('catAdvanced', language),
    },
    {
      type: 'divider',
      label: t('blockDivider', language),
      description: t('blockDividerDesc', language),
      icon: <Minus className="w-4 h-4 text-gray-400" />,
      category: t('catAdvanced', language),
    },
    {
      type: 'code',
      label: t('blockCode', language),
      description: t('blockCodeDesc', language),
      icon: <Code className="w-4 h-4 text-emerald-500" />,
      category: t('catAdvanced', language),
    },
    {
      type: 'math',
      label: t('blockMath', language),
      description: t('blockMathDesc', language),
      icon: <span className="w-4 h-4 flex items-center justify-center font-bold font-mono text-sm text-indigo-500">∑</span>,
      category: t('catAdvanced', language),
    },
    {
      type: 'diagram',
      label: t('blockDiagram', language),
      description: t('blockDiagramDesc', language),
      icon: <Workflow className="w-4 h-4 text-emerald-500" />,
      category: t('catAdvanced', language),
      extra: { content: 'graph TD;\n  A[Start] --> B{Process};\n  B -->|Yes| C[Success];\n  B -->|No| D[Retry];' },
    },
    {
      type: 'toc',
      label: t('blockToc', language),
      description: t('blockTocDesc', language),
      icon: <ListTree className="w-4 h-4 text-cyan-500" />,
      category: t('catAdvanced', language),
    },
    {
      type: 'database',
      label: t('blockTable', language),
      description: t('blockTableDesc', language),
      icon: <Table className="w-4 h-4 text-indigo-500" />,
      category: t('catDatabase', language),
      extra: { view: 'table' },
    },
    {
      type: 'database',
      label: t('blockBoard', language),
      description: t('blockBoardDesc', language),
      icon: <Kanban className="w-4 h-4 text-pink-500" />,
      category: t('catDatabase', language),
      extra: { view: 'board' },
    },
    {
      type: 'database',
      label: t('blockGallery', language),
      description: t('blockGalleryDesc', language),
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
      category: t('catDatabase', language),
      extra: { view: 'gallery' },
    },
  ], [language]);

  const filteredItems = menuItems
    .filter((item) => {
      if (features) {
        if (!features.math && item.type === 'math') return false;
        if (!features.diagrams && item.type === 'diagram') return false;
        if (!features.toc && item.type === 'toc') return false;
        if (!features.databases && item.type === 'database') return false;
      }
      return true;
    })
    .filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase())
    );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex].type, filteredItems[selectedIndex].extra);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        top: `${position.top + 28}px`,
        left: `${Math.max(20, Math.min(position.left, window.innerWidth - 320))}px`,
      }}
      className="fixed z-50 w-72 max-h-80 overflow-y-auto rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#252525] shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {t('catBasic', language)}
      </div>

      {filteredItems.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-gray-400">{t('noResultsFound', language)}</div>
      ) : (
        filteredItems.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={`${item.type}-${item.label}`}
              onClick={() => onSelect(item.type, item.extra)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-start transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#efefee] dark:bg-[#323232] text-[#37352f] dark:text-[#ebebeb]'
                  : 'hover:bg-[#f5f5f4] dark:hover:bg-[#2c2c2c] text-[#37352f] dark:text-[#ebebeb]'
              }`}
            >
              <div className="w-8 h-8 rounded border border-gray-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] flex items-center justify-center shrink-0 shadow-xs">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{item.label}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};
