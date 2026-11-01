import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Check, AlertCircle, FileArchive } from 'lucide-react';
import { Page, Block } from '../types';
import { parseMarkdownToBlocks } from '../services/storage';
import { nanoid } from 'nanoid';
import { t, Language } from '../i18n';

interface ImportModalProps {
  isOpen: boolean;
  language?: Language;
  onClose: () => void;
  onImportPages: (newPages: Page[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  language = 'en',
  onClose,
  onImportPages,
}) => {
  const [filesLoaded, setFilesLoaded] = useState<{ name: string; content: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const readList: { name: string; content: string }[] = [];
    let count = 0;

    Array.from(files).forEach((file) => {
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          readList.push({ name: file.name.replace(/\.(md|txt)$/, ''), content });
          count++;
          if (count === files.length) {
            setFilesLoaded((prev) => [...prev, ...readList]);
          }
        };
        reader.readAsText(file);
      } else {
        count++;
      }
    });
  };

  const handleApplyImport = () => {
    if (filesLoaded.length === 0) return;

    const newPages: Page[] = filesLoaded.map(({ name, content }) => {
      const parsed = parseMarkdownToBlocks(content, name);
      const newPageId = 'page-' + nanoid(8);
      return {
        id: newPageId,
        parentId: null,
        title: parsed.title,
        icon: '📄',
        cover: null,
        isFavorite: false,
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        font: 'sans',
        fullWidth: false,
        smallText: false,
        blocks: parsed.blocks,
      };
    });

    onImportPages(newPages);
    setFilesLoaded([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-200 dark:border-[#2e2e2e] shadow-2xl overflow-hidden flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2e2e2e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('importMarkdown', language)}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Import Obsidian, Notion markdown exports, or standard .md files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone */}
        <div className="p-6 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-gray-200 dark:border-[#333] hover:border-gray-400 dark:hover:border-gray-600 bg-[#fbfbfa] dark:bg-[#252525]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.txt"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <FileText className="w-8 h-8 text-indigo-500 mb-2" />
            <p className="font-semibold text-xs text-gray-900 dark:text-white mb-1">
              Click to browse or drop markdown files here
            </p>
            <p className="text-[11px] text-gray-400">
              Supports .md, .txt from Obsidian, Notion, GitHub, and Logseq
            </p>
          </div>

          {/* Files Preview */}
          {filesLoaded.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                Files to import ({filesLoaded.length}):
              </div>
              {filesLoaded.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-[#262626] border border-gray-200/60 dark:border-[#333] text-xs"
                >
                  <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
                    {f.name}.md
                  </span>
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              {t('cancel', language)}
            </button>
            <button
              onClick={handleApplyImport}
              disabled={filesLoaded.length === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Import {filesLoaded.length > 0 ? `(${filesLoaded.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
