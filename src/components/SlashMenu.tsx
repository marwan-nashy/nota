import React, { useEffect, useRef, useState } from 'react';
import { 
  Type, Heading1, Heading2, Heading3, CheckSquare, List, ListOrdered, 
  ChevronRight, Quote, Minus, AlertCircle, Code, Table, Kanban,
  Image as ImageIcon, FileText, Sparkles
} from 'lucide-react';
import { BlockType } from '../types';

interface SlashMenuProps {
  isOpen: boolean;
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
  category: 'Basic' | 'Lists' | 'Media' | 'Database' | 'Advanced';
  extra?: any;
}

const MENU_ITEMS: MenuItem[] = [
  {
    type: 'paragraph',
    label: 'Text',
    description: 'Just start writing with plain text.',
    icon: <Type className="w-4 h-4 text-gray-500" />,
    category: 'Basic',
  },
  {
    type: 'heading1',
    label: 'Heading 1',
    description: 'Big section heading.',
    icon: <Heading1 className="w-4 h-4 text-blue-500" />,
    category: 'Basic',
  },
  {
    type: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading.',
    icon: <Heading2 className="w-4 h-4 text-blue-500" />,
    category: 'Basic',
  },
  {
    type: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading.',
    icon: <Heading3 className="w-4 h-4 text-blue-500" />,
    category: 'Basic',
  },
  {
    type: 'todo',
    label: 'To-do list',
    description: 'Track tasks with a to-do list.',
    icon: <CheckSquare className="w-4 h-4 text-green-500" />,
    category: 'Lists',
  },
  {
    type: 'bullet',
    label: 'Bulleted list',
    description: 'Create a simple bulleted list.',
    icon: <List className="w-4 h-4 text-orange-500" />,
    category: 'Lists',
  },
  {
    type: 'number',
    label: 'Numbered list',
    description: 'Create a list with numbering.',
    icon: <ListOrdered className="w-4 h-4 text-yellow-500" />,
    category: 'Lists',
  },
  {
    type: 'toggle',
    label: 'Toggle list',
    description: 'Toggles can show and hide content.',
    icon: <ChevronRight className="w-4 h-4 text-gray-500" />,
    category: 'Lists',
  },
  {
    type: 'page_link',
    label: 'Sub-page',
    description: 'Embed a child page inside this document.',
    icon: <FileText className="w-4 h-4 text-indigo-500" />,
    category: 'Basic',
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Embed an image via link or upload.',
    icon: <ImageIcon className="w-4 h-4 text-rose-500" />,
    category: 'Media',
  },
  {
    type: 'callout',
    label: 'Callout',
    description: 'Make writing stand out with an icon.',
    icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
    category: 'Advanced',
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Capture a quote or citation.',
    icon: <Quote className="w-4 h-4 text-purple-500" />,
    category: 'Advanced',
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Visually divide blocks with a line.',
    icon: <Minus className="w-4 h-4 text-gray-400" />,
    category: 'Advanced',
  },
  {
    type: 'code',
    label: 'Code',
    description: 'Capture a code snippet with syntax styling.',
    icon: <Code className="w-4 h-4 text-emerald-500" />,
    category: 'Advanced',
  },
  {
    type: 'database',
    label: 'Table Database',
    description: 'Spreadsheet-like tabular database view.',
    icon: <Table className="w-4 h-4 text-indigo-500" />,
    category: 'Database',
    extra: { view: 'table' },
  },
  {
    type: 'database',
    label: 'Kanban Board',
    description: 'Visual board view grouped by status.',
    icon: <Kanban className="w-4 h-4 text-pink-500" />,
    category: 'Database',
    extra: { view: 'board' },
  },
];

export const SlashMenu: React.FC<SlashMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
  query,
  position,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = MENU_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
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
        Basic blocks
      </div>

      {filteredItems.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-gray-400">No matching blocks</div>
      ) : (
        filteredItems.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={`${item.type}-${item.label}`}
              onClick={() => onSelect(item.type, item.extra)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
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
