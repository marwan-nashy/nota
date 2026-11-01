import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Page, Block } from '../types';
import { encryptText, decryptText } from '../services/crypto';
import { t, Language } from '../i18n';

interface LockModalProps {
  isOpen: boolean;
  page: Page;
  language?: Language;
  onClose: () => void;
  onPageLocked: (updatedPage: Page) => void;
  onPageUnlocked: (decryptedBlocks: Block[], removeEncryption?: boolean) => void;
}

export const LockModal: React.FC<LockModalProps> = ({
  isOpen,
  page,
  language = 'en',
  onClose,
  onPageLocked,
  onPageUnlocked,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const isAlreadyLocked = Boolean(page.isLocked && page.encryptedData);

  const handleUnlock = async (removeLockPermanently = false) => {
    if (!password.trim()) {
      setError(t('enterPassword', language));
      return;
    }
    if (!page.encryptedData || !page.salt || !page.iv) return;

    setIsLoading(true);
    setError(null);
    try {
      const json = await decryptText(page.encryptedData, page.salt, page.iv, password);
      const blocks: Block[] = JSON.parse(json);
      onPageUnlocked(blocks, removeLockPermanently);
      setPassword('');
      onClose();
    } catch (err) {
      setError(t('incorrectPassword', language));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = async () => {
    if (!password.trim()) {
      setError(t('enterPassword', language));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch', language));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const plaintext = JSON.stringify(page.blocks);
      const { ciphertext, salt, iv } = await encryptText(plaintext, password);
      const updated: Page = {
        ...page,
        isLocked: true,
        encryptedData: ciphertext,
        salt,
        iv,
        blocks: [], // Cleared from memory / storage while locked
        updatedAt: Date.now(),
      };
      onPageLocked(updated);
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Encryption failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#202020] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#303030] overflow-hidden"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header Banner */}
        <div className="p-6 pb-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            {isAlreadyLocked ? <KeyRound className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 text-emerald-500" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {isAlreadyLocked ? t('unlockPage', language) : t('lockPage', language)}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isAlreadyLocked
                ? t('enterPasswordToUnlock', language)
                : t('setPasswordDesc', language)}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('enterPassword', language)}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (isAlreadyLocked) handleUnlock(false);
                    else handleLock();
                  }
                }}
                autoFocus
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#383838] bg-gray-50 dark:bg-[#181818] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isAlreadyLocked && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('confirmPassword', language)}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLock();
                }}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#383838] bg-gray-50 dark:bg-[#181818] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}

          <div className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#181818] p-3 rounded-xl border border-gray-200/60 dark:border-[#2a2a2a] leading-relaxed">
            🔒 <b>AES-GCM 256-bit:</b> {language === 'ar' ? 'التشفير يتم محلياً بالكامل على جهازك عبر Web Crypto API بدون إرسال أي بيانات.' : 'Encryption runs 100% locally in your browser via Web Crypto API with zero cloud transmission.'}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 dark:bg-[#181818] border-t border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            {t('cancel', language)}
          </button>

          <div className="flex items-center gap-2">
            {isAlreadyLocked && (
              <button
                type="button"
                onClick={() => handleUnlock(true)}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title={t('removeLock', language)}
              >
                {t('removeLock', language)}
              </button>
            )}

            <button
              type="button"
              onClick={() => (isAlreadyLocked ? handleUnlock(false) : handleLock())}
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {isLoading
                ? '...'
                : isAlreadyLocked
                ? t('unlock', language)
                : t('lock', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
