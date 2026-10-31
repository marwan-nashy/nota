import React from 'react';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { Page } from '../types';

interface TrashModalProps {
  isOpen: boolean;
  pages: Record<string, Page>;
  onClose: () => void;
  onRestorePage: (id: string) => void;
  onPermanentDeletePage: (id: string) => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  pages,
  onClose,
  onRestorePage,
  onPermanentDeletePage,
}) => {
  if (!isOpen) return null;

  const archivedPages = Object.values(pages).filter((p) => p.isArchived);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2e2e2e] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
          <div className="flex items-center gap-2 font-semibold text-sm text-[#37352f] dark:text-[#ebebeb]">
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Trash & Archive</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {archivedPages.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">Trash is completely empty</div>
          ) : (
            archivedPages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#efefee] dark:hover:bg-[#2e2e2e] text-xs text-[#37352f] dark:text-[#ebebeb]"
              >
                <div className="flex items-center gap-2 truncate flex-1 mr-2">
                  <span>{page.icon || '📄'}</span>
                  <span className="truncate font-medium">{page.title || 'Untitled'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onRestorePage(page.id)}
                    className="p-1 rounded hover:bg-white dark:hover:bg-[#383838] text-blue-600 dark:text-blue-400 flex items-center gap-1 text-[11px]"
                    title="Restore page"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                  <button
                    onClick={() => onPermanentDeletePage(page.id)}
                    className="p-1 rounded hover:bg-white dark:hover:bg-[#383838] text-red-600 dark:text-red-400"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
