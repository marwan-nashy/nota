import React, { useRef, useState, useEffect } from 'react';
import katex from 'katex';
import mermaid from 'mermaid';
import { 
  GripVertical, Plus, ChevronRight, ChevronDown, Check, Copy, CheckCheck, Trash2, 
  ArrowRightLeft, AlertCircle, Sparkles, Image as ImageIcon, Link as LinkIcon, 
  ExternalLink, ListTree, ArrowUp, ArrowDown, Workflow, Mic
} from 'lucide-react';
import { Block, BlockType, Database } from '../types';
import { DatabaseView } from './DatabaseView';
import { VoiceMemoBlock } from './VoiceMemoBlock';
import { t, Language } from '../i18n';

try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
    suppressErrorRendering: true,
  });
} catch (e) {
  // ignore init errors
}

function renderKaTeX(tex: string): string {
  const formula = tex && tex.trim() ? tex : 'E = mc^2';
  try {
    return katex.renderToString(formula, {
      throwOnError: false,
      displayMode: true,
    });
  } catch (e: any) {
    return `<span class="text-rose-500 font-mono text-xs">${e?.message || 'Invalid formula'}</span>`;
  }
}

interface BlockItemProps {
  block: Block;
  index: number;
  isFocused: boolean;
  database?: Database;
  targetPageTitle?: string;
  targetPageIcon?: string;
  language?: Language;
  allBlocks?: Block[];
  onUpdateBlock: (updated: Block) => void;
  onAddBlockBelow: (currentId: string, type?: BlockType) => void;
  onDeleteBlock: (id: string) => void;
  onFocusBlock: (id: string) => void;
  onFocusPrevious: (id: string) => void;
  onFocusNext: (id: string) => void;
  onOpenSlashMenu: (pos: { top: number; left: number }, query: string, blockId: string) => void;
  onNavigateToPage?: (pageId: string) => void;
  onUpdateDatabase?: (db: Database) => void;
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDragLeave?: () => void;
  onDrop?: (index: number) => void;
  onMoveBlock?: (fromIndex: number, toIndex: number) => void;
  isDragOver?: boolean;
  isDragging?: boolean;
}

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  index,
  isFocused,
  database,
  targetPageTitle,
  targetPageIcon,
  language = 'en',
  allBlocks,
  onUpdateBlock,
  onAddBlockBelow,
  onDeleteBlock,
  onFocusBlock,
  onFocusPrevious,
  onFocusNext,
  onOpenSlashMenu,
  onNavigateToPage,
  onUpdateDatabase,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onMoveBlock,
  isDragOver,
  isDragging,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [diagramSvg, setDiagramSvg] = useState<string>('');
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Render Mermaid diagrams
  useEffect(() => {
    if (block.type !== 'diagram') return;
    let isCancelled = false;
    const code = (block.content && block.content.trim())
      ? block.content.trim()
      : 'graph TD;\n  A[Start] --> B{Process};\n  B -->|Yes| C[Success];\n  B -->|No| D[Retry];';
    const id = 'mermaid-' + block.id.replace(/[^a-zA-Z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);

    mermaid.render(id, code)
      .then((res) => {
        if (!isCancelled) {
          setDiagramSvg(res.svg);
          setDiagramError(null);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setDiagramError(err?.message || 'Invalid Mermaid syntax');
        }
      });

    return () => { isCancelled = true; };
  }, [block.type, block.content]);

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
            <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
              <span>or</span>
              <label className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium">
                Upload image from device
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onUpdateBlock({ ...block, content: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Rendering for Audio / Voice Memo Block
  if (block.type === 'audio') {
    return (
      <div className="relative group/block my-2">
        <VoiceMemoBlock
          id={block.id}
          audioUrl={block.audioUrl || block.content}
          audioDuration={block.audioDuration}
          language={language}
          onUpdate={(url, dur) => onUpdateBlock({ ...block, audioUrl: url, audioDuration: dur, content: url })}
          onDelete={() => onDeleteBlock(block.id)}
        />
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
    <div
      id={`block-${block.id}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver?.(index);
      }}
      onDragLeave={() => onDragLeave?.()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(index);
      }}
      className={`relative group/block flex items-start py-1 min-h-[30px] transition-all ${
        isDragOver ? 'border-t-2 border-indigo-500 pt-2' : ''
      } ${isDragging ? 'opacity-30' : ''}`}
    >
      {/* Left Hover Handle Buttons */}
      <div className="absolute -left-14 rtl:-right-14 rtl:left-auto top-1.5 opacity-0 group-hover/block:opacity-100 flex items-center gap-0.5 text-gray-400 transition-opacity select-none z-20">
        <button
          onClick={() => onAddBlockBelow(block.id)}
          className="p-1 rounded hover:bg-[#efefee] dark:hover:bg-[#2e2e2e] hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
          title="Click to add block below"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div
          draggable={true}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', block.id);
            e.dataTransfer.effectAllowed = 'move';
            onDragStart?.(index);
          }}
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 rounded hover:bg-[#efefee] dark:hover:bg-[#2e2e2e] hover:text-gray-700 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing"
          title={t('dragToReorder', language)}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
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
          <button
            onClick={() => { onUpdateBlock({ ...block, type: 'math', content: block.content || 'E = mc^2' }); setShowMenu(false); }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 flex items-center justify-between cursor-pointer"
          >
            <span>{t('blockMath', language)}</span>
            <span className="font-mono text-xs font-bold text-indigo-500">∑</span>
          </button>
          <button
            onClick={() => {
              onUpdateBlock({
                ...block,
                type: 'diagram',
                content: block.content || 'graph TD;\n  A[Start] --> B{Process};\n  B -->|Yes| C[Success];\n  B -->|No| D[Retry];'
              });
              setShowMenu(false);
            }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 flex items-center justify-between cursor-pointer"
          >
            <span>{t('blockDiagram', language)}</span>
            <Workflow className="w-3.5 h-3.5 text-emerald-500" />
          </button>
          <button
            onClick={() => { onUpdateBlock({ ...block, type: 'toc' }); setShowMenu(false); }}
            className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 flex items-center justify-between cursor-pointer"
          >
            <span>{t('blockToc', language)}</span>
            <ListTree className="w-3.5 h-3.5 text-cyan-500" />
          </button>

          {/* Reordering shortcuts */}
          <div className="my-1 border-t border-gray-100 dark:border-[#383838]"></div>
          {index > 0 && (
            <button
              onClick={() => { onMoveBlock?.(index, index - 1); setShowMenu(false); }}
              className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5 text-gray-400" /> {t('moveUp', language)}
            </button>
          )}
          {allBlocks && index < allBlocks.length - 1 && (
            <button
              onClick={() => { onMoveBlock?.(index, index + 1); setShowMenu(false); }}
              className="w-full text-start px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5 text-gray-400" /> {t('moveDown', language)}
            </button>
          )}

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
        ) : block.type === 'math' ? (
          <div className="my-2 rounded-lg p-3.5 bg-gray-50/80 dark:bg-[#202020] border border-gray-200 dark:border-[#303030] shadow-xs group/math transition-all">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-gray-200 dark:border-[#2e2e2e] text-[10px] font-mono uppercase text-gray-400 select-none">
              <span className="flex items-center gap-1.5 font-semibold text-indigo-500 dark:text-indigo-400">
                <span className="text-sm leading-none">∑</span>
                <span>{t('blockMath', language)}</span>
              </span>
              <span className="text-[10px] text-gray-400 bg-gray-200/50 dark:bg-[#2e2e2e] px-1.5 py-0.5 rounded">LaTeX</span>
            </div>
            
            {/* KaTeX live preview rendered output */}
            <div 
              className="py-3 px-3 overflow-x-auto text-center flex items-center justify-center min-h-[44px] text-gray-900 dark:text-gray-100 select-text"
              dangerouslySetInnerHTML={{
                __html: renderKaTeX(block.content)
              }}
            />

            {/* Editable LaTeX source formula input */}
            <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-[#303030] flex items-center gap-2">
              <span className="text-gray-400 font-mono text-xs select-none">TeX:</span>
              <input
                type="text"
                dir="ltr"
                value={block.content || ''}
                onChange={(e) => onUpdateBlock({ ...block, content: e.target.value })}
                placeholder={t('mathPlaceholder', language)}
                className="flex-1 font-mono text-xs bg-transparent border-none outline-none text-indigo-600 dark:text-indigo-400 placeholder-gray-400 focus:ring-0"
              />
            </div>
          </div>
        ) : block.type === 'diagram' ? (
          <div className="my-2 rounded-xl p-3.5 bg-gray-50/80 dark:bg-[#1a1b26] border border-gray-200 dark:border-[#2e3146] shadow-xs group/diagram transition-all">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-[#2a2d3d] text-[10px] font-mono uppercase text-gray-400 select-none">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-500 dark:text-emerald-400">
                <Workflow className="w-4 h-4" />
                <span>{t('blockDiagram', language)}</span>
              </span>
              <span className="text-[10px] text-gray-400 bg-gray-200/50 dark:bg-[#282a3a] px-2 py-0.5 rounded">Mermaid</span>
            </div>

            {/* Rendered SVG Preview */}
            <div className="py-4 px-2 overflow-x-auto flex items-center justify-center min-h-[100px] bg-white dark:bg-[#12131c] rounded-lg border border-gray-100 dark:border-[#242636]">
              {diagramError ? (
                <div className="p-3 text-rose-500 font-mono text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{diagramError}</span>
                </div>
              ) : diagramSvg ? (
                <div
                  className="max-w-full overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: diagramSvg }}
                />
              ) : (
                <span className="text-gray-400 text-xs italic">Rendering diagram...</span>
              )}
            </div>

            {/* Source Code Editor */}
            <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-[#2a2d3d]">
              <textarea
                dir="ltr"
                rows={3}
                value={block.content || ''}
                onChange={(e) => onUpdateBlock({ ...block, content: e.target.value })}
                placeholder={t('diagramPlaceholder', language)}
                className="w-full font-mono text-xs p-2 bg-transparent border border-gray-200 dark:border-[#2a2d3d] rounded-lg outline-none text-emerald-600 dark:text-emerald-400 placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 resize-y"
              />
            </div>
          </div>
        ) : block.type === 'toc' ? (
          <div className="my-2 p-3.5 rounded-xl border border-gray-200 dark:border-[#2e2e2e] bg-gray-50/70 dark:bg-[#202020] text-xs">
            <div className="flex items-center gap-2 mb-2.5 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none text-[11px]">
              <ListTree className="w-4 h-4 text-cyan-500" />
              <span>{t('tableOfContents', language)}</span>
            </div>
            {(() => {
              const headings = (allBlocks || [])
                .filter((b) => b.type === 'heading1' || b.type === 'heading2' || b.type === 'heading3')
                .map((b) => ({
                  id: b.id,
                  type: b.type,
                  text: (b.content || '').replace(/<[^>]*>/g, '').trim() || (b.type === 'heading1' ? 'Heading 1' : b.type === 'heading2' ? 'Heading 2' : 'Heading 3'),
                }));
              if (headings.length === 0) {
                return <p className="text-gray-400 italic text-xs py-1">{t('noHeadingsFound', language)}</p>;
              }
              return (
                <div className="space-y-1">
                  {headings.map((h, i) => (
                    <button
                      key={`${h.id}-${i}`}
                      onClick={() => {
                        const el = document.getElementById(`block-${h.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.classList.add('ring-2', 'ring-indigo-500', 'rounded-lg');
                          setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500', 'rounded-lg'), 1500);
                        }
                      }}
                      className={`w-full text-start flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-white dark:hover:bg-[#282828] hover:shadow-2xs transition-all cursor-pointer ${
                        h.type === 'heading1'
                          ? 'font-bold text-[#37352f] dark:text-white'
                          : h.type === 'heading2'
                          ? 'ps-4 font-medium text-gray-700 dark:text-gray-300'
                          : 'ps-8 text-gray-500 dark:text-gray-400 text-[11px]'
                      }`}
                    >
                      <span className="text-cyan-500/80 font-mono text-[10px] select-none">•</span>
                      <span className="truncate">{h.text}</span>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="relative flex-1 group/heading">
            {(block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3') && (
              <button
                onClick={() => onUpdateBlock({ ...block, collapsed: !block.collapsed })}
                title={block.collapsed ? t('expandHeading', language) : t('collapseHeading', language)}
                className={`absolute -left-6 rtl:-left-auto rtl:-right-6 top-1.5 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-[#333] transition-all cursor-pointer ${
                  block.collapsed ? 'opacity-100 text-indigo-500' : 'opacity-0 group-hover/heading:opacity-100 text-gray-400'
                }`}
              >
                {block.collapsed ? (
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
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
            {block.collapsed && (block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3') && (
              <span
                onClick={() => onUpdateBlock({ ...block, collapsed: false })}
                className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer select-none"
              >
                ... {t('expandHeading', language)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
