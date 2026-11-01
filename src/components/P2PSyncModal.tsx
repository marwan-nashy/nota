import React, { useState } from 'react';
import { QrCode, X, Copy, Check, Smartphone, Laptop, Download, ArrowRightLeft, Sparkles } from 'lucide-react';
import { WorkspaceState } from '../types';
import { exportWorkspaceJSON } from '../services/storage';
import { t, Language } from '../i18n';

interface P2PSyncModalProps {
  isOpen: boolean;
  workspaceState: WorkspaceState;
  language?: Language;
  onClose: () => void;
  onImportSyncCode: (jsonStr: string) => void;
}

export const P2PSyncModal: React.FC<P2PSyncModalProps> = ({
  isOpen,
  workspaceState,
  language = 'en',
  onClose,
  onImportSyncCode,
}) => {
  const [copied, setCopied] = useState(false);
  const [pasteCode, setPasteCode] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const jsonStr = exportWorkspaceJSON(workspaceState);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyPaste = () => {
    try {
      if (!pasteCode.trim()) return;
      onImportSyncCode(pasteCode.trim());
      setImportStatus('success');
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1200);
    } catch {
      setImportStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-200 dark:border-[#2e2e2e] shadow-2xl overflow-hidden flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2e2e2e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('p2pSync', language)}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('p2pSyncDesc', language)}
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

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Export Code Card */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#252525] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-white">
                <Laptop className="w-4 h-4 text-indigo-500" />
                <span>Device 1: Export Current Workspace</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('copied', language) : 'Copy Sync Code'}</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Copies your full encrypted workspace payload into your clipboard to paste into another device or send securely over local Wi-Fi.
            </p>
          </div>

          {/* Import Code Card */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#252525] space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-white">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Device 2: Receive & Apply Sync Code</span>
            </div>
            <textarea
              value={pasteCode}
              onChange={(e) => setPasteCode(e.target.value)}
              placeholder="Paste sync code or JSON here..."
              rows={3}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-xs font-mono text-[#37352f] dark:text-[#ebebeb] focus:border-emerald-500 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between">
              {importStatus === 'success' && (
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {t('importSuccess', language)}
                </span>
              )}
              {importStatus === 'error' && (
                <span className="text-xs text-rose-500 font-semibold">
                  Invalid sync code format.
                </span>
              )}
              {!importStatus && <span />}
              <button
                onClick={handleApplyPaste}
                disabled={!pasteCode.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                Apply Sync
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
