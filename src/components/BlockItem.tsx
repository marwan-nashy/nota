import React, { useRef, useState, useEffect } from 'react';
import { 
  GripVertical, Plus, ChevronRight, Check, Copy, CheckCheck, Trash2, 
  ArrowRightLeft, AlertCircle, Sparkles, Image as ImageIcon, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import { Block, BlockType, Database } from '../types';
import { DatabaseView } from './DatabaseView';
import { t, Language } from '../i18n';

interface BlockItemProps {
  block: Block;
  index: number;
  isFocused: boolean;
  database?: Database;
  targetPageTitle?: string;
  targetPageIcon?: string;
  language?: Language;
  onUpdateBlock: (updated: Block) => void;
  onAddBlockBelow: (currentId: string, type?: BlockType) => void;
  onDeleteBlock: (id: string) => void;
  onFocusBlock: (id: string) => void;
  onFocusPrevious: (id: string) => void;
  onFocusNext: (id: string) => void;
  onOpenSlashMenu: (pos: { top: number; left: number }, query: string, blockId: string) => void;
  onNavigateToPage?: (pageId: string) => void;
  onUpdateDatabase?: (db: Database) => void;
}

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  index,
  isFocused,
  database,
  targetPageTitle,
  targetPageIcon,
  language = 'en',
  onUpdateBlock,
  onAddBlockBelow,
  onDeleteBlock,
  onFocusBlock,
  onFocusPrevious,
  onFocusNext,
  onOpenSlashMenu,
  onNavigateToPage,
  onUpdateDatabase,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync content with ref
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== block.content) {
      contentRef.current.innerHTML = block.content;
    }
  }, [block.content]);

  // Focus management
  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isFocused]);

  // Close context menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Handle typing, markdown conversion, and slash commands
  const handleInput = () => {
    if (!contentRef.current) return;
    const text = contentRef.current.innerText;

    // Markdown triggers
    if (text.startsWith('# ')) {
      contentRef.current.innerText = text.slice(2);
      onUpdateBlock({ ...block, type: 'heading1', content: contentRef.current.innerText });
      return;
    }
    if (text.startsWith('## ')) {
      contentRef.current.innerText = text.slice(3);
      onUpdateBlock({ ...block, type: 'heading2', content: contentRef.current.innerText });
      return;
    }
    if (text.startsWith('### ')) {
      contentRef.current.innerText = text.slice(4);
      onUpdateBlock({ ...block, type: 'heading3', content: contentRef.current.innerText });
      return;
    }
    if (text.startsWith('[] ') || text.startsWith('[ ] ')) {
      contentRef.current.innerText = text.replace(/^\[\s?\]\s/, '');
      onUpdateBlock({ ...block, type: 'todo', checked: false, content: contentRef.current.innerText });
      return;
    }
    if (text.startsWith('- ') || text.startsWith('* ')) {
      contentRef.current.innerText = text.slice(2);
      onUpdateBlock({ ...block, type: 'bullet', content: contentRef.current.innerText });
      return;
    }
    if (/^\d+\.\s/.test(text)) {
      contentRef.current.innerText = text.replace(/^\d+\.\s/, '');
      onUpdateBlock({ ...block, type: 'number', content: contentRef.current.innerText });
      return;
    }
    if (text.startsWith('> ')) {
      contentRef.current.innerText = text.slice(2);
      onUpdateBlock({ ...block, type: 'quote', content: contentRef.current.innerText });
      return;
    }
    if (text.startsWith('---')) {
      contentRef.current.innerText = '';
      onUpdateBlock({ ...block, type: 'divider', content: '' });
      onAddBlockBelow(block.id, 'paragraph');
      return;
    }

    // Slash menu trigger
    if (text.startsWith('/')) {
      const rect = contentRef.current.getBoundingClientRect();
      onOpenSlashMenu({ top: rect.bottom, left: rect.left }, text.slice(1), block.id);
    }

    onUpdateBlock({ ...block, content: contentRef.current.innerHTML });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (block.type === 'code') return;
      e.preventDefault();
      onAddBlockBelow(
        block.id,
        block.type === 'todo' ? 'todo' : block.type === 'bullet' ? 'bullet' : 'paragraph'
      );
    } else if (e.key === 'Backspace') {
      const text = contentRef.current?.innerText || '';
      if (text === '') {
        e.preventDefault();
        if (block.type !== 'paragraph') {
          onUpdateBlock({ ...block, type: 'paragraph' });
        } else {
          onDeleteBlock(block.id);
        }
      }
    } else if (e.key === 'ArrowUp') {
      const sel = window.getSelection();
      if (sel && sel.anchorOffset === 0) {
        e.preventDefault();
        onFocusPrevious(block.id);
      }
    } else if (e.key === 'ArrowDown') {
      const text = contentRef.current?.innerText || '';
      const sel = window.getSelection();
      if (sel && sel.anchorOffset >= text.length) {
        e.preventDefault();
        onFocusNext(block.id);
      }
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(block.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Rendering for Database Block
  if (block.type === 'database') {
    if (!database) {
      return <div className="py-2 text-xs text-gray-400 italic">Database not found</div>;
    }
    return (
      <div className="relative group/block my-2">
        <DatabaseView database={database} onUpdateDatabase={onUpdateDatabase || (() => {})} />
      </div>
    );
  }

  // Rendering for Sub-Page Link Block
  if (block.type === 'page_link') {
    return (
      <div className="relative group/block my-1.5">
        <div
          onClick={() => {
            if (block.targetPageId && onNavigateToPage) {
              onNavigateToPage(block.targetPageId);
            }
          }}
          className="flex items-center justify-between p-2.5 rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#202020] hover:bg-[#efefee] dark:hover:bg-[#282828] cursor-pointer transition-all shadow-2xs group/link"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{targetPageIcon || '📄'}</span>
            <span dir="auto" className="text-xs font-semibold text-[#37352f] dark:text-[#ebebeb] underline decoration-gray-300 dark:decoration-gray-600 underline-offset-2">
              {targetPageTitle || block.content || t('untitledSubpage', language)}
            </span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover/link:text-gray-600 dark:group-hover/link:text-gray-200" />
        </div>
      </div>
    );
  }

  // Rendering for Image Block
  if (block.type === 'image') {
    return (
      <div className="relative group/block my-3">
        {block.content ? (
          <div className="relative group/img rounded-xl overflow-hidden border border-[#e9e9e7] dark:border-[#2e2e2e]">
            <img
              src={block.content}
              alt="Embedded"
              className="w-full max-h-[450px] object-cover rounded-xl"
            />
            <button
              onClick={() => onUpdateBlock({ ...block, content: '' })}
              className="absolute right-3 rtl:right-auto rtl:left-3 top-3 opacity-0 group-hover/img:opacity-100 p-1.5 rounded-md bg-black/70 text-white hover:bg-black text-xs transition-opacity cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-[#383838] bg-[#fbfbfa] dark:bg-[#222222] text-center">
            <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <p className="text-xs text-gray-500 mb-2">{t('embedImage', language)}</p>
            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
              <input
                type="text"
                dir="ltr"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder={t('pasteImageUrl', language)}
                className="flex-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs focus:outline-none text-[#37352f] dark:text-[#ebebeb]"
              />
              <button
                onClick={() => {
                  if (imageUrlInput.trim()) {
                    onUpdateBlock({ ...block, content: imageUrlInput.trim() });
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 cursor-pointer"
              >
                {t('embed', language)}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Rendering for Divider Block
  if (block.type === 'divider') {
    return (
      <div className="relative group/block py-3 my-1">
        <div className="absolute -left-12 rtl:-right-12 rtl:left-auto top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 flex items-center gap-0.5 text-gray-400 transition-opacity select-none">
          <button
            onClick={() => onAddBlockBelow(block.id)}
            className="p-1 rounded hover:bg-[#efefee] dark:hover:bg-[#2e2e2e] hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
            title="Click to add below"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteBlock(block.id)}
            className="p-1 rounded hover:bg-[#efefee] dark:hover:bg-[#2e2e2e] hover:text-red-500 cursor-pointer"
            title="Delete divider"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <hr className="border-t border-[#e9e9e7] dark:border-[#2e2e2e]" />
      </div>
    );
  }

  return (
    <div className="relative group/block flex items-start py-1 min-h-[30px]">
      {/* Left Hover Handle Buttons */}
      <div className="absolute -left-14 rtl:-right-14 rtl:left-auto top-1.5 opacity-0 group-hover/block:opacity-100 flex items-center gap-0.5 text-gray-400 transition-opacity select-none z-20">
        <button
          onClick={() => onAddBlockBelow(block.id)}
          className="p-1 rounded hover:bg-[#efefee] dark:hover:bg-[#2e2e2e] hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
          title="Click to add block below"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 rounded hover:bg-[#efefee] dark:hover:bg-[#2e2e2e] hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
          title="Drag to move or click for options"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block Options Dropdown Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute left-[-20px] rtl:left-auto rtl:right-[-20px] top-8 z-40 w-48 rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#252525] shadow-xl p-1 text-xs"
        >
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400">{t('turnInto', language)}</div>
          <button
            onClick={() => { onUpdateBlock({ ...block, type: 'paragraph' }); setShowMenu(false); }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
          >
            {t('blockText', language)}
          </button>
          <button
            onClick={() => { onUpdateBlock({ ...block, type: 'heading1' }); setShowMenu(false); }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 font-semibold cursor-pointer"
          >
            {t('blockHeading1', language)}
          </button>
          <button
            onClick={() => { onUpdateBlock({ ...block, type: 'heading2' }); setShowMenu(false); }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 font-semibold cursor-pointer"
          >
            {t('blockHeading2', language)}
          </button>
          <button
            onClick={() => { onUpdateBlock({ ...block, type: 'todo' }); setShowMenu(false); }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
          >
            {t('blockTodo', language)}
          </button>
          <button
            onClick={() => { onUpdateBlock({ ...block, type: 'bullet' }); setShowMenu(false); }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
          >
            {t('blockBullet', language)}
          </button>
          <button
            onClick={() => { onUpdateBlock({ ...block, type: 'callout', icon: '💡' }); setShowMenu(false); }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
          >
            {t('blockCallout', language)}
          </button>
          <button
            onClick={() => { onUpdateBlock({ ...block, type: 'code', language: 'typescript' }); setShowMenu(false); }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
          >
            {t('blockCode', language)}
          </button>
          <div className="my-1 border-t border-gray-100 dark:border-[#383838]"></div>
          <button
            onClick={() => { onDeleteBlock(block.id); setShowMenu(false); }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t('delete', language)}
          </button>
        </div>
      )}

      {/* Block Type Prefix Decorators */}
      {block.type === 'todo' && (
        <button
          onClick={() => onUpdateBlock({ ...block, checked: !block.checked })}
          className={`w-4 h-4 mt-1 mr-2 rtl:mr-0 rtl:ml-2 rounded border transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
            block.checked
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 bg-transparent'
          }`}
        >
          {block.checked && <Check className="w-3 h-3 stroke-[3]" />}
        </button>
      )}

      {block.type === 'bullet' && (
        <span className="w-1.5 h-1.5 mt-2.5 mr-3 rtl:mr-0 rtl:ml-3 rounded-full bg-gray-700 dark:bg-gray-300 shrink-0" />
      )}

      {block.type === 'number' && (
        <span className="text-xs font-mono font-medium text-gray-500 mr-2.5 rtl:mr-0 rtl:ml-2.5 mt-1 shrink-0 select-none">
          {index + 1}.
        </span>
      )}

      {block.type === 'toggle' && (
        <button
          onClick={() => onUpdateBlock({ ...block, isOpen: !block.isOpen })}
          className="p-0.5 mt-0.5 mr-1 rtl:mr-0 rtl:ml-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-transform cursor-pointer"
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-150 ${block.isOpen ? 'rotate-90' : 'rtl:rotate-180'}`} />
        </button>
      )}

      {/* Block Content Rendering Container */}
      <div className="flex-1 min-w-0">
        {block.type === 'callout' ? (
          <div className="flex items-start gap-3 p-3.5 rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#222222] text-[#37352f] dark:text-[#ebebeb]">
            <span className="text-xl select-none leading-none mt-0.5">{block.icon || '💡'}</span>
            <div
              ref={contentRef}
              dir="auto"
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => onFocusBlock(block.id)}
              className="flex-1 text-sm focus:outline-none min-h-[22px]"
            />
          </div>
        ) : block.type === 'quote' ? (
          <div className="border-l-3 rtl:border-r-3 rtl:border-l-0 border-[#37352f] dark:border-gray-400 pl-4 rtl:pr-4 rtl:pl-0 py-1 italic text-gray-700 dark:text-gray-300">
            <div
              ref={contentRef}
              dir="auto"
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => onFocusBlock(block.id)}
              className="focus:outline-none min-h-[24px]"
            />
          </div>
        ) : block.type === 'code' ? (
          <div className="rounded-lg bg-[#2b2b2b] text-[#f8f8f2] font-mono text-xs p-3 relative group/code overflow-x-auto shadow-inner border border-[#383838]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3e3e3e] text-gray-400 text-[11px] select-none">
              <span>{block.language || 'typescript'}</span>
              <button
                onClick={copyCodeToClipboard}
                className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded bg-[#383838] transition-colors cursor-pointer"
              >
                {copiedCode ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? t('copied', language) : t('copy', language)}</span>
              </button>
            </div>
            <div
              ref={contentRef}
              dir="ltr"
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => onFocusBlock(block.id)}
              className="focus:outline-none whitespace-pre leading-relaxed min-h-[40px] text-left"
            />
          </div>
        ) : (
          <div
            ref={contentRef}
            dir="auto"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => onFocusBlock(block.id)}
            className={`focus:outline-none min-h-[24px] ${
              block.type === 'heading1'
                ? 'text-3xl font-bold tracking-tight mt-4 mb-2 text-[#37352f] dark:text-[#ffffff]'
                : block.type === 'heading2'
                ? 'text-2xl font-bold tracking-tight mt-3 mb-1.5 text-[#37352f] dark:text-[#ffffff]'
                : block.type === 'heading3'
                ? 'text-xl font-semibold tracking-tight mt-2 mb-1 text-[#37352f] dark:text-[#ffffff]'
                : block.type === 'todo' && block.checked
                ? 'line-through text-gray-400 dark:text-gray-500'
                : 'text-sm leading-relaxed text-[#37352f] dark:text-[#ebebeb]'
            }`}
          />
        )}
      </div>
    </div>
  );
};
