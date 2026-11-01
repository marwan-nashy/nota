import React, { useState, useEffect } from 'react';
import { History, X, RotateCcw, Clock, CheckCircle2, Save, FileText } from 'lucide-react';
import { Page, PageSnapshot } from '../types';
import { getPageSnapshots, savePageSnapshot } from '../services/storage';
import { t, Language } from '../i18n';

interface HistoryModalProps {
  isOpen: boolean;
  page: Page;
  language?: Language;
  onClose: () => void;
  onRestoreSnapshot: (snapshot: PageSnapshot) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  page,
  language = 'en',
  onClose,
  onRestoreSnapshot,
}) => {
  const [snapshots, setSnapshots] = useState<PageSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<PageSnapshot | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (isOpen && page) {
      const list = getPageSnapshots(page.id);
      setSnapshots(list);
      setSelectedSnapshot(list[0] || null);
    }
  }, [isOpen, page?.id]);

  if (!isOpen || !page) return null;

  const calculateWordCount = (blocks = page.blocks) => {
    return blocks.reduce((acc, b) => {
      const text = b.content.replace(/<[^>]*>/g, '').trim();
      return acc + (text ? text.split(/\s+/).length : 0);
    }, 0);
  };

  const handleCreateSnapshot = () => {
    const snap: PageSnapshot = {
      id: 'snap-' + Date.now(),
      pageId: page.id,
      timestamp: Date.now(),
      title: page.title,
      blocks: JSON.parse(JSON.stringify(page.blocks)),
      wordCount: calculateWordCount(),
    };
    savePageSnapshot(snap);
    const updated = getPageSnapshots(page.id);
    setSnapshots(updated);
    setSelectedSnapshot(snap);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleRestore = (snap: PageSnapshot) => {
    if (confirm(t('restoreConfirm', language))) {
      // First save current state as a snapshot so it can be un-done
      handleCreateSnapshot();
      onRestoreSnapshot(snap);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-200 dark:border-[#2e2e2e] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2e2e2e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('versionHistory', language)}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {page.title || t('untitled', language)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-semibold transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{justSaved ? t('snapshotSaved', language) : t('takeSnapshotNow', language)}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Left snapshots list, Right preview */}
        <div className="flex-1 flex min-h-[400px] overflow-hidden">
          {/* Left Column: Timeline */}
          <div className="w-72 border-r border-gray-200 dark:border-[#2e2e2e] p-3 flex flex-col gap-1.5 bg-[#fcfcfb] dark:bg-[#1c1c1c] overflow-y-auto">
            {/* Current Active State item */}
            <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 mb-2">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('currentVersionBadge', language)}</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {page.blocks.length} blocks · {calculateWordCount()} words
              </p>
            </div>

            <div className="text-[10px] font-mono uppercase text-gray-400 tracking-wider px-2 py-1">
              {t('history', language)} ({snapshots.length})
            </div>

            {snapshots.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 italic">
                {t('noSnapshots', language)}
              </div>
            ) : (
              snapshots.map((snap) => (
                <div
                  key={snap.id}
                  onClick={() => setSelectedSnapshot(snap)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedSnapshot?.id === snap.id
                      ? 'bg-white dark:bg-[#252525] border-indigo-500 dark:border-indigo-400 shadow-xs'
                      : 'border-transparent hover:bg-gray-200/50 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(snap.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {snap.blocks.length} blocks · {snap.wordCount} words
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Snapshot preview */}
          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-[#1f1f1f] flex flex-col justify-between">
            {selectedSnapshot ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#2e2e2e]">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                      {selectedSnapshot.title || t('untitled', language)}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {new Date(selectedSnapshot.timestamp).toLocaleString()} · {selectedSnapshot.wordCount} words
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(selectedSnapshot)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('restoreVersion', language)}</span>
                  </button>
                </div>

                {/* Preview of blocks */}
                <div className="space-y-2 bg-gray-50 dark:bg-[#191919] p-4 rounded-xl border border-gray-200/60 dark:border-[#292929] max-h-[340px] overflow-y-auto text-xs font-sans">
                  {selectedSnapshot.blocks.map((b, idx) => (
                    <div key={idx} className="text-gray-700 dark:text-gray-300">
                      {b.type === 'heading1' && <h1 className="font-bold text-base text-gray-900 dark:text-white">{b.content}</h1>}
                      {b.type === 'heading2' && <h2 className="font-bold text-sm text-gray-900 dark:text-white">{b.content}</h2>}
                      {b.type === 'heading3' && <h3 className="font-bold text-xs text-gray-900 dark:text-white">{b.content}</h3>}
                      {b.type === 'todo' && <p className="flex items-center gap-2"><span>{b.checked ? '☑' : '☐'}</span> <span>{b.content}</span></p>}
                      {b.type === 'bullet' && <p>• {b.content}</p>}
                      {b.type === 'number' && <p>1. {b.content}</p>}
                      {b.type === 'code' && <pre className="p-2 bg-black/10 rounded font-mono text-[11px]">{b.content}</pre>}
                      {b.type === 'quote' && <blockquote className="border-l-2 border-indigo-400 pl-2 italic">{b.content}</blockquote>}
                      {b.type === 'paragraph' && <p>{b.content || <span className="text-gray-400 italic">Empty block</span>}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                <FileText className="w-8 h-8 mb-2 opacity-30" />
                <span>Select a snapshot from the timeline to preview</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
