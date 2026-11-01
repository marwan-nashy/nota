import React, { useState, useEffect, useRef } from 'react';
import { Search, Replace, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { t, Language } from '../i18n';
import { Block } from '../types';

interface FindReplaceBarProps {
  isOpen: boolean;
  blocks: Block[];
  language?: Language;
  onClose: () => void;
  onUpdateBlocks: (newBlocks: Block[]) => void;
  onFocusBlock?: (blockId: string) => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  blocks,
  language = 'en',
  onClose,
  onUpdateBlocks,
  onFocusBlock,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  const findInputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => findInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Compute matches across blocks
  const matches = React.useMemo(() => {
    if (!findText) return [];
    const results: { blockId: string; blockIndex: number; startIdx: number }[] = [];

    blocks.forEach((b, bIdx) => {
      const text = b.content.replace(/<[^>]*>/g, '');
      const query = matchCase ? findText : findText.toLowerCase();
      const target = matchCase ? text : text.toLowerCase();

      let pos = 0;
      while ((pos = target.indexOf(query, pos)) !== -1) {
        results.push({ blockId: b.id, blockIndex: bIdx, startIdx: pos });
        pos += query.length || 1;
      }
    });

    return results;
  }, [blocks, findText, matchCase]);

  // Reset index when matches change
  useEffect(() => {
    if (matches.length > 0) {
      if (currentMatchIdx >= matches.length) {
        setCurrentMatchIdx(0);
      }
      const activeMatch = matches[currentMatchIdx] || matches[0];
      if (activeMatch && onFocusBlock) {
        onFocusBlock(activeMatch.blockId);
      }
    }
  }, [matches, currentMatchIdx]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % matches.length;
    setCurrentMatchIdx(nextIdx);
    onFocusBlock?.(matches[nextIdx].blockId);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + matches.length) % matches.length;
    setCurrentMatchIdx(prevIdx);
    onFocusBlock?.(matches[prevIdx].blockId);
  };

  const handleReplaceOne = () => {
    if (matches.length === 0 || !findText) return;
    const current = matches[currentMatchIdx];
    if (!current) return;

    const newBlocks = blocks.map((b) => {
      if (b.id !== current.blockId) return b;
      const flags = matchCase ? 'g' : 'gi';
      // Replace only first occurrence in target block
      const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      let count = 0;
      const newContent = b.content.replace(regex, (m) => {
        if (count === 0) {
          count++;
          return replaceText;
        }
        return m;
      });
      return { ...b, content: newContent };
    });

    onUpdateBlocks(newBlocks);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0 || !findText) return;
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

    const newBlocks = blocks.map((b) => {
      if (!b.content) return b;
      return { ...b, content: b.content.replace(regex, replaceText) };
    });

    onUpdateBlocks(newBlocks);
  };

  return (
    <div className="fixed top-14 right-6 z-40 bg-white/95 dark:bg-[#202020]/95 backdrop-blur-md rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xl p-2.5 flex flex-col gap-2 min-w-[340px] max-w-[420px] transition-all animate-in fade-in slide-in-from-top-2">
      {/* Top Find Row */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={findInputRef}
            type="text"
            value={findText}
            onChange={(e) => {
              setFindText(e.target.value);
              setCurrentMatchIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) handlePrev();
                else handleNext();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder={t('findPlaceholder', language)}
            className="w-full pl-8 pr-16 py-1.5 text-xs rounded-xl bg-gray-100 dark:bg-[#2a2a2a] border border-transparent focus:border-indigo-500 focus:outline-none text-[#37352f] dark:text-[#ebebeb]"
          />
          {findText && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-gray-400 select-none">
              {matches.length > 0 ? `${currentMatchIdx + 1}/${matches.length}` : '0/0'}
            </span>
          )}
        </div>

        {/* Prev / Next buttons */}
        <button
          onClick={handlePrev}
          disabled={matches.length === 0}
          title="Previous match (Shift+Enter)"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] disabled:opacity-30 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleNext}
          disabled={matches.length === 0}
          title="Next match (Enter)"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] disabled:opacity-30 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Replace Row */}
        <button
          onClick={() => setShowReplace(!showReplace)}
          title={t('replace', language)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            showReplace
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
              : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-gray-400'
          }`}
        >
          <Replace className="w-3.5 h-3.5" />
        </button>

        {/* Match Case Toggle */}
        <button
          onClick={() => setMatchCase(!matchCase)}
          title={t('matchCase', language)}
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
            matchCase
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400'
          }`}
        >
          Aa
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Replace Row (Collapsible) */}
      {showReplace && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-white/5">
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder={t('replacePlaceholder', language)}
            className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-gray-100 dark:bg-[#2a2a2a] border border-transparent focus:border-indigo-500 focus:outline-none text-[#37352f] dark:text-[#ebebeb]"
          />
          <button
            onClick={handleReplaceOne}
            disabled={matches.length === 0}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-[#2e2e2e] hover:bg-gray-200 dark:hover:bg-[#383838] disabled:opacity-30 text-[#37352f] dark:text-[#ebebeb] transition-colors cursor-pointer shrink-0"
          >
            {t('replace', language)}
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition-colors cursor-pointer shrink-0"
          >
            {t('replaceAll', language)}
          </button>
        </div>
      )}
    </div>
  );
};
