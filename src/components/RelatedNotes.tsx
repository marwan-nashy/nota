import React, { useMemo } from 'react';
import { Sparkles, ArrowRight, Tag } from 'lucide-react';
import { Page } from '../types';
import { findRelatedPages } from '../services/bm25Search';
import { Language } from '../i18n';

interface RelatedNotesProps {
  currentPageId: string;
  pages: Record<string, Page>;
  language?: Language;
  onSelectPage: (id: string) => void;
}

export const RelatedNotes: React.FC<RelatedNotesProps> = ({
  currentPageId,
  pages,
  language = 'en',
  onSelectPage,
}) => {
  const related = useMemo(() => {
    return findRelatedPages(currentPageId, pages, 3);
  }, [currentPageId, pages]);

  if (related.length === 0) return null;

  return (
    <div className="mt-12 pt-6 border-t border-gray-200 dark:border-[#2e2e2e] space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>{language === 'ar' ? 'ملاحظات مرتبطة بالمعنى' : 'Related by meaning'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {related.map(({ page, similarity, sharedKeywords }) => (
          <button
            key={page.id}
            onClick={() => onSelectPage(page.id)}
            className="flex flex-col text-start p-3 rounded-xl border border-gray-200 dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#1f1f1f] hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-[#252525] transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-base">{page.icon || '📄'}</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {Math.round(similarity * 100)}% match
              </span>
            </div>

            <div className="font-semibold text-xs text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate w-full">
              {page.title}
            </div>

            {sharedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sharedKeywords.slice(0, 2).map((kw, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-mono text-gray-400 bg-gray-100 dark:bg-[#2b2b2b] px-1 py-0.2 rounded"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
