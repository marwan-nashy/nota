import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, Star, MoreHorizontal, Download, Trash2, Maximize2, Minimize2, 
  Type, Check, FileText, Printer, Code, Share2, Lock, Unlock, ListTree
} from 'lucide-react';
import { Page, FeatureFlags } from '../types';
import { exportPageMarkdown } from '../services/storage';
import { t, Language } from '../i18n';

interface NavbarProps {
  page: Page;
  sidebarOpen: boolean;
  language: Language;
  features?: FeatureFlags;
  isOutlineOpen?: boolean;
  onToggleSidebar: () => void;
  onToggleOutline?: () => void;
  onOpenLockModal?: () => void;
  onUpdatePage: (updated: Page) => void;
  onDeletePage: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  page,
  sidebarOpen,
  language,
  features,
  isOutlineOpen,
  onToggleSidebar,
  onToggleOutline,
  onOpenLockModal,
  onUpdatePage,
  onDeletePage,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const allText = page.blocks.map((b) => b.content).join(' ');
  const wordCount = allText.trim() ? allText.trim().split(/\s+/).length : 0;
  const charCount = allText.length;

  const handleExportMarkdown = () => {
    const md = exportPageMarkdown(page);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${page.title || 'untitled'}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleExportHTML = () => {
    const content = page.blocks.map(b => `<div class="block ${b.type}">${b.content}</div>`).join('\n');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${page.title}</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;line-height:1.6;color:#333;}.block{margin:8px 0;}</style></head><body><h1>${page.icon} ${page.title}</h1>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${page.title || 'untitled'}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handlePrint = () => {
    window.print();
    setShowMenu(false);
  };

  return (
    <header className="h-11 border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-white/80 dark:bg-[#191919]/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30 select-none">
      {/* Left: Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggleSidebar}
          className={`p-1 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer shrink-0 ${
            !sidebarOpen ? 'block' : 'block md:hidden'
          }`}
          title={t('openSidebar', language)}
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>{t('workspace', language)}</span>
          <span>/</span>
          <span dir="auto" className="flex items-center gap-1 font-medium text-[#37352f] dark:text-[#ebebeb] max-w-[200px] truncate">
            <span>{page.icon || '📄'}</span>
            <span>{page.title || t('untitled', language)}</span>
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Document Outline Toggle */}
        {(!features || features.toc) && (
          <button
            onClick={onToggleOutline}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isOutlineOpen
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-[#efefee] dark:hover:bg-[#2c2c2c]'
            }`}
            title={t('outline', language)}
          >
            <ListTree className="w-4 h-4" />
          </button>
        )}

        {/* Lock / Vault Status */}
        {(!features || features.vault) && (
          <button
            onClick={onOpenLockModal}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              page.isLocked
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-[#efefee] dark:hover:bg-[#2c2c2c]'
            }`}
            title={page.isLocked ? t('unlockPage', language) : t('lockPage', language)}
          >
            {page.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        )}

        {/* Star / Favorite */}
        <button
          onClick={() => onUpdatePage({ ...page, isFavorite: !page.isFavorite })}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            page.isFavorite
              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-[#efefee] dark:hover:bg-[#2c2c2c]'
          }`}
          title={page.isFavorite ? t('removeFromFavorites', language) : t('addToFavorites', language)}
        >
          <Star className={`w-4 h-4 ${page.isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* More Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
            title={t('moreOptions', language)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 rtl:right-auto rtl:left-0 top-8 z-50 w-64 bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-2xl rounded-xl p-2 text-xs animate-in fade-in zoom-in-95"
            >
              <div className="px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {t('style', language)}
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 mb-2 bg-[#f5f5f4] dark:bg-[#1e1e1e] rounded-lg">
                <button
                  onClick={() => onUpdatePage({ ...page, font: 'sans' })}
                  className={`py-1 text-center font-sans rounded cursor-pointer ${
                    page.font === 'sans'
                      ? 'bg-white dark:bg-[#2f2f2f] font-semibold shadow-xs text-blue-600 dark:text-blue-400'
                      : 'text-gray-500'
                  }`}
                >
                  {t('defaultFont', language)}
                </button>
                <button
                  onClick={() => onUpdatePage({ ...page, font: 'serif' })}
                  className={`py-1 text-center font-serif rounded cursor-pointer ${
                    page.font === 'serif'
                      ? 'bg-white dark:bg-[#2f2f2f] font-semibold shadow-xs text-blue-600 dark:text-blue-400'
                      : 'text-gray-500'
                  }`}
                >
                  {t('serifFont', language)}
                </button>
                <button
                  onClick={() => onUpdatePage({ ...page, font: 'mono' })}
                  className={`py-1 text-center font-mono rounded cursor-pointer ${
                    page.font === 'mono'
                      ? 'bg-white dark:bg-[#2f2f2f] font-semibold shadow-xs text-blue-600 dark:text-blue-400'
                      : 'text-gray-500'
                  }`}
                >
                  {t('monoFont', language)}
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-[#383838] my-1"></div>

              {/* Layout Toggles */}
              <div className="space-y-0.5">
                {(!features || features.vault) && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenLockModal?.();
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{page.isLocked ? t('unlockPage', language) : t('lockPage', language)}</span>
                    </span>
                  </button>
                )}
                <button
                  onClick={() => onUpdatePage({ ...page, fullWidth: !page.fullWidth })}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  <span>{t('fullWidth', language)}</span>
                  {page.fullWidth && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
                <button
                  onClick={() => onUpdatePage({ ...page, smallText: !page.smallText })}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  <span>{t('smallText', language)}</span>
                  {page.smallText && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-[#383838] my-1"></div>

              {/* Export Actions */}
              <div className="space-y-0.5">
                <button
                  onClick={handleExportMarkdown}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-gray-400" />
                  <span>{t('exportMarkdown', language)}</span>
                </button>
                <button
                  onClick={handleExportHTML}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5 text-gray-400" />
                  <span>{t('exportHtml', language)}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#efefee] dark:hover:bg-[#323232] text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-400" />
                  <span>{t('printPage', language)}</span>
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-[#383838] my-1"></div>

              {/* Delete Page */}
              <button
                onClick={() => {
                  onDeletePage(page.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('deletePage', language)}</span>
              </button>

              <div className="border-t border-gray-100 dark:border-[#383838] mt-2 pt-2 text-[10px] text-gray-400 px-2 flex justify-between">
                <span>{wordCount} {t('words', language)}</span>
                <span>{charCount} {t('characters', language)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
