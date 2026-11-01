import React, { useState } from 'react';
import { Image, Smile, Trash2, X } from 'lucide-react';
import { Page } from '../types';
import { t, Language } from '../i18n';

interface PageHeaderProps {
  page: Page;
  language: Language;
  onUpdatePage: (updated: Page) => void;
}

const EMOJI_PALETTE = [
  '📄', '🚀', '💡', '🎯', '⚡', '📝', '🧠', '📚', 
  '🛠️', '🎨', '🌟', '💻', '☕', '🔍', '📈', '🪐',
  '🧪', '🏆', '🔥', '✨', '📌', '🏷️', '✅', '❤️'
];

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
  'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
  'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
  'linear-gradient(135deg, #434343 0%, #000000 100%)',
];

export const PageHeader: React.FC<PageHeaderProps> = ({ page, language, onUpdatePage }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  return (
    <div className="relative mb-6">
      {/* Cover Image Banner */}
      {page.cover && (
        <div
          style={{ background: page.cover }}
          className="h-44 w-full rounded-b-xl relative group transition-all"
        >
          <div className="absolute right-4 rtl:right-auto rtl:left-4 bottom-3 opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
            <button
              onClick={() => setShowCoverPicker(true)}
              className="bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1 rounded backdrop-blur-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Image className="w-3.5 h-3.5" /> {t('changeCover', language)}
            </button>
            <button
              onClick={() => onUpdatePage({ ...page, cover: null })}
              className="bg-black/60 hover:bg-black/80 text-white text-xs p-1 rounded backdrop-blur-xs transition-colors cursor-pointer"
              title={t('removeCover', language)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Cover Picker Dropdown */}
      {showCoverPicker && (
        <div className="absolute right-4 rtl:right-auto rtl:left-4 top-20 z-40 bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xl rounded-xl p-3 w-64 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-[#383838] text-xs font-semibold text-gray-700 dark:text-gray-200">
            <span>{t('selectGradient', language)}</span>
            <button onClick={() => setShowCoverPicker(false)}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {COVER_GRADIENTS.map((grad, i) => (
              <button
                key={i}
                onClick={() => {
                  onUpdatePage({ ...page, cover: grad });
                  setShowCoverPicker(false);
                }}
                style={{ background: grad }}
                className="h-12 rounded-lg border border-white/20 hover:scale-105 transition-transform cursor-pointer"
              />
            ))}
          </div>
        </div>
      )}

      {/* Page Actions Bar (Add Icon / Add Cover) */}
      <div className={`flex items-center gap-2 mb-2 ${page.cover ? 'px-8 -mt-9' : 'px-8 pt-4'}`}>
        {/* Page Icon */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-5xl hover:scale-110 active:scale-95 transition-transform select-none cursor-pointer filter drop-shadow-sm"
            title={t('changeIcon', language)}
          >
            {page.icon || '📄'}
          </button>

          {/* Emoji Picker Modal */}
          {showEmojiPicker && (
            <div className="absolute left-0 rtl:left-auto rtl:right-0 top-16 z-50 bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-2xl rounded-xl p-3 w-64 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-[#383838] text-xs font-semibold text-gray-700 dark:text-gray-200">
                <span>{t('pickIcon', language)}</span>
                <button onClick={() => setShowEmojiPicker(false)}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2 text-2xl">
                {EMOJI_PALETTE.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onUpdatePage({ ...page, icon: emoji });
                      setShowEmojiPicker(false);
                    }}
                    className="hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100 dark:hover:bg-[#333333] cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick buttons when cover is absent */}
        {!page.cover && (
          <div className="opacity-0 hover:opacity-100 flex items-center gap-2 mx-2 transition-opacity">
            <button
              onClick={() => onUpdatePage({ ...page, cover: COVER_GRADIENTS[0] })}
              className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-[#2e2e2e] cursor-pointer"
            >
              <Image className="w-3.5 h-3.5" /> {t('addCover', language)}
            </button>
          </div>
        )}
      </div>

      {/* Large Page Title */}
      <div className="px-8 mt-2">
        <input
          type="text"
          dir="auto"
          value={page.title}
          onChange={(e) => onUpdatePage({ ...page, title: e.target.value })}
          placeholder={t('pageTitlePlaceholder', language)}
          className="w-full text-4xl font-extrabold text-[#37352f] dark:text-[#ffffff] bg-transparent border-none focus:outline-none placeholder-gray-300 dark:placeholder-gray-600 tracking-tight"
        />
      </div>
    </div>
  );
};
