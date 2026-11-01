import React from 'react';
import { ListTree, X, ChevronRight } from 'lucide-react';
import { Page } from '../types';
import { t, Language } from '../i18n';

interface OutlineDrawerProps {
  isOpen: boolean;
  page: Page;
  language?: Language;
  onClose: () => void;
}

export const OutlineDrawer: React.FC<OutlineDrawerProps> = ({
  isOpen,
  page,
  language = 'en',
  onClose,
}) => {
  if (!isOpen) return null;

  const headings = page.blocks
    .filter((b) => b.type === 'heading1' || b.type === 'heading2' || b.type === 'heading3')
    .map((b) => {
      const cleanText = (b.content || '').replace(/<[^>]*>/g, '').trim();
      return {
        id: b.id,
        type: b.type,
        text: cleanText || (b.type === 'heading1' ? 'Heading 1' : b.type === 'heading2' ? 'Heading 2' : 'Heading 3'),
      };
    });

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(`block-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-indigo-500', 'rounded-lg');
      setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500', 'rounded-lg'), 1500);
    }
  };

  return (
    <div 
      className="fixed inset-y-0 right-0 rtl:right-auto rtl:left-0 z-40 w-72 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-md border-l rtl:border-l-0 rtl:border-r border-gray-200 dark:border-[#2e2e2e] shadow-2xl flex flex-col animate-in slide-in-from-right rtl:slide-in-from-left duration-200 select-none"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="h-12 px-4 border-b border-gray-200 dark:border-[#2e2e2e] flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wider">
          <ListTree className="w-4 h-4 text-indigo-500" />
          <span>{t('outline', language)}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2c2c2c] text-gray-500 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Heading List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {headings.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs text-gray-400">
            <ListTree className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>{t('noHeadingsFound', language)}</p>
          </div>
        ) : (
          headings.map((h, i) => (
            <button
              key={`${h.id}-${i}`}
              onClick={() => scrollToHeading(h.id)}
              className={`w-full text-start flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs transition-colors cursor-pointer group ${
                h.type === 'heading1'
                  ? 'font-bold text-gray-900 dark:text-white'
                  : h.type === 'heading2'
                  ? 'ps-4 font-medium text-gray-700 dark:text-gray-300'
                  : 'ps-7 text-gray-500 dark:text-gray-400 text-[11px]'
              }`}
            >
              <ChevronRight className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              <span className="truncate">{h.text}</span>
            </button>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-200 dark:border-[#2e2e2e] text-[11px] font-mono text-gray-400 flex items-center justify-between">
        <span>{headings.length} {language === 'ar' ? 'عنوان' : 'headings'}</span>
        <span>Nota Outline</span>
      </div>
    </div>
  );
};
