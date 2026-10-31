import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, Code, Palette, Link as LinkIcon } from 'lucide-react';

const PALETTE_COLORS = [
  { name: 'Default', text: 'inherit', bg: 'transparent' },
  { name: 'Gray', text: '#787774', bg: '#f1f1ef' },
  { name: 'Brown', text: '#9f6b53', bg: '#f4eeee' },
  { name: 'Orange', text: '#d9730d', bg: '#faecdd' },
  { name: 'Yellow', text: '#cb912f', bg: '#fbf3db' },
  { name: 'Green', text: '#448361', bg: '#edf3ec' },
  { name: 'Blue', text: '#337ea9', bg: '#e7f3f8' },
  { name: 'Purple', text: '#9065b0', bg: '#f4f0f7' },
  { name: 'Pink', text: '#c14c8a', bg: '#f9f0f5' },
  { name: 'Red', text: '#d44c47', bg: '#fdebec' },
];

export const FloatingToolbar: React.FC = () => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [showColors, setShowColors] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPosition(null);
        setShowColors(false);
        return;
      }

      // Check if selection is within a contentEditable area
      const anchorNode = selection.anchorNode;
      const element = anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;
      if (!element || !element.closest('[contenteditable="true"]')) {
        setPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setPosition(null);
        return;
      }

      setPosition({
        top: Math.max(10, rect.top - 46),
        left: Math.max(10, Math.min(rect.left + rect.width / 2 - 130, window.innerWidth - 300)),
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  if (!position) return null;

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  const applyColor = (color: typeof PALETTE_COLORS[0], isBg = false) => {
    if (isBg) {
      exec('hiliteColor', color.bg);
    } else {
      exec('foreColor', color.text);
    }
    setShowColors(false);
  };

  return (
    <div
      ref={toolbarRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-50 flex items-center gap-0.5 p-1 rounded-lg bg-[#252525] text-white shadow-2xl border border-[#3e3e3e] text-xs animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      <button
        onMouseDown={(e) => { e.preventDefault(); exec('bold'); }}
        className="p-1.5 rounded hover:bg-[#383838] transition-colors"
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        onMouseDown={(e) => { e.preventDefault(); exec('italic'); }}
        className="p-1.5 rounded hover:bg-[#383838] transition-colors"
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        onMouseDown={(e) => { e.preventDefault(); exec('underline'); }}
        className="p-1.5 rounded hover:bg-[#383838] transition-colors"
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        onMouseDown={(e) => { e.preventDefault(); exec('strikeThrough'); }}
        className="p-1.5 rounded hover:bg-[#383838] transition-colors"
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) {
            exec('formatBlock', '<code>');
          }
        }}
        className="p-1.5 rounded hover:bg-[#383838] transition-colors"
        title="Inline Code"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-gray-600 mx-0.5"></div>

      {/* Colors & Highlights Dropdown */}
      <div className="relative">
        <button
          onMouseDown={(e) => { e.preventDefault(); setShowColors(!showColors); }}
          className="p-1.5 rounded hover:bg-[#383838] transition-colors flex items-center gap-1"
          title="Color & Highlight"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {showColors && (
          <div className="absolute left-0 top-8 z-50 w-44 bg-[#2b2b2b] border border-[#3e3e3e] rounded-lg shadow-xl p-2 text-xs">
            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Text Color</div>
            <div className="grid grid-cols-5 gap-1 mb-2">
              {PALETTE_COLORS.slice(0, 10).map((c) => (
                <button
                  key={c.name}
                  onMouseDown={(e) => { e.preventDefault(); applyColor(c, false); }}
                  className="w-6 h-6 rounded flex items-center justify-center font-bold hover:scale-110"
                  style={{ color: c.text }}
                  title={c.name}
                >
                  A
                </button>
              ))}
            </div>

            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Highlight</div>
            <div className="grid grid-cols-5 gap-1">
              {PALETTE_COLORS.slice(1, 10).map((c) => (
                <button
                  key={`bg-${c.name}`}
                  onMouseDown={(e) => { e.preventDefault(); applyColor(c, true); }}
                  className="w-6 h-6 rounded border border-white/20 hover:scale-110"
                  style={{ backgroundColor: c.bg }}
                  title={`${c.name} Background`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
