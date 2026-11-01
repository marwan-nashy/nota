import React, { useState, useMemo } from 'react';
import { Hash, X, Search, FileText, ArrowRight, Tag } from 'lucide-react';
import { Page } from '../types';
import { t, Language } from '../i18n';

interface TagExplorerModalProps {
  isOpen: boolean;
  pages: Record<string, Page>;
  language?: Language;
  onClose: () => void;
  onNavigateToPage: (pageId: string) => void;
}

export const TagExplorerModal: React.FC<TagExplorerModalProps> = ({
  isOpen,
  pages,
  language = 'en',
  onClose,
  onNavigateToPage,
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all tags from pages & blocks
  const tagData = useMemo(() => {
    const counts: Record<string, { count: number; occurrences: { page: Page; snippet: string }[] }> = {};
    const tagRegex = /#([\w\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+)/g;

    Object.values(pages).forEach((page) => {
      if (page.isArchived) return;

      page.blocks.forEach((block) => {
        const text = block.content.replace(/<[^>]*>/g, '');
        let match;
        const seenInBlock = new Set<string>();

        while ((match = tagRegex.exec(text)) !== null) {
          const rawTag = match[1].toLowerCase();
          if (!seenInBlock.has(rawTag)) {
            seenInBlock.add(rawTag);
            if (!counts[rawTag]) {
              counts[rawTag] = { count: 0, occurrences: [] };
            }
            counts[rawTag].count++;
            counts[rawTag].occurrences.push({
              page,
              snippet: text.slice(0, 120),
            });
          }
        }
      });
    });

    return counts;
  }, [pages]);

  const sortedTags = useMemo(() => {
    return Object.entries(tagData)
      .sort((a, b) => b[1].count - a[1].count)
      .filter(([tag]) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tagData, searchQuery]);

  // Set default selected tag when opened
  React.useEffect(() => {
    if (isOpen && sortedTags.length > 0 && !selectedTag) {
      setSelectedTag(sortedTags[0][0]);
    }
  }, [isOpen, sortedTags, selectedTag]);

  if (!isOpen) return null;

  const activeOccurrences = selectedTag ? tagData[selectedTag]?.occurrences || [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-200 dark:border-[#2e2e2e] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2e2e2e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 dark:text-violet-400">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('tagExplorer', language)}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('featTagsDesc', language)}
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

        {/* Content Body: Left tag list, Right occurrences */}
        <div className="flex-1 flex min-h-[380px] overflow-hidden">
          {/* Left Column: Tags */}
          <div className="w-64 border-r border-gray-200 dark:border-[#2e2e2e] p-3 flex flex-col gap-2 bg-[#fcfcfb] dark:bg-[#1c1c1c]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tags..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] focus:border-violet-500 focus:outline-none text-[#37352f] dark:text-[#ebebeb]"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {sortedTags.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  {t('noTagsFound', language)}
                </div>
              ) : (
                sortedTags.map(([tag, data]) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      selectedTag === tag
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-[#292929]'
                    }`}
                  >
                    <span className="truncate">#{tag}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        selectedTag === tag
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 dark:bg-[#333] text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {data.count}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Occurrences for selected tag */}
          <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-[#1f1f1f]">
            {selectedTag ? (
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-[#2e2e2e]">
                  <Hash className="w-4 h-4 text-violet-500" />
                  <span className="font-bold text-sm text-gray-900 dark:text-white">#{selectedTag}</span>
                  <span className="text-xs text-gray-400">
                    ({activeOccurrences.length} references)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeOccurrences.map(({ page, snippet }, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onNavigateToPage(page.id);
                        onClose();
                      }}
                      className="p-3 rounded-xl border border-gray-200 dark:border-[#2e2e2e] hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/20 dark:hover:bg-violet-950/10 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold text-xs text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">
                          <span>{page.icon || '📄'}</span>
                          <span>{page.title || t('untitled', language)}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500 transition-colors" />
                      </div>
                      {snippet && (
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">
                          "{snippet}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                <Tag className="w-8 h-8 mb-2 opacity-30" />
                <span>Select a tag to browse matching pages</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
