import React, { useState, useEffect } from 'react';
import { 
  Settings, X, Sliders, RefreshCw, CheckCircle2, AlertCircle, 
  Download, ExternalLink, Network, Workflow, Binary, Calendar, 
  Link as LinkIcon, Lock, ListTree, Table, Layout, Sparkles, RotateCcw
} from 'lucide-react';
import { FeatureFlags } from '../types';
import { checkForAppUpdates, UpdateCheckResult, CURRENT_VERSION } from '../services/updater';
import { t, Language } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  initialTab?: 'features' | 'updates';
  features: FeatureFlags;
  language?: Language;
  onClose: () => void;
  onToggleFeature: (key: keyof FeatureFlags) => void;
  onResetFeatures: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  initialTab = 'features',
  features,
  language = 'en',
  onClose,
  onToggleFeature,
  onResetFeatures,
}) => {
  const [activeTab, setActiveTab] = useState<'features' | 'updates'>('features');
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleCheckUpdates = async () => {
    setIsChecking(true);
    const res = await checkForAppUpdates();
    setUpdateResult(res);
    setIsChecking(false);
  };

  const FEATURE_ITEMS: {
    key: keyof FeatureFlags;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'graph',
      label: t('featGraph', language),
      description: t('featGraphDesc', language),
      icon: <Network className="w-4 h-4" />,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      key: 'diagrams',
      label: t('featDiagrams', language),
      description: t('featDiagramsDesc', language),
      icon: <Workflow className="w-4 h-4" />,
      color: 'text-teal-500 bg-teal-500/10',
    },
    {
      key: 'math',
      label: t('featMath', language),
      description: t('featMathDesc', language),
      icon: <Binary className="w-4 h-4" />,
      color: 'text-indigo-500 bg-indigo-500/10',
    },
    {
      key: 'dailyNotes',
      label: t('featDailyNotes', language),
      description: t('featDailyNotesDesc', language),
      icon: <Calendar className="w-4 h-4" />,
      color: 'text-sky-500 bg-sky-500/10',
    },
    {
      key: 'backlinks',
      label: t('featBacklinks', language),
      description: t('featBacklinksDesc', language),
      icon: <LinkIcon className="w-4 h-4" />,
      color: 'text-cyan-500 bg-cyan-500/10',
    },
    {
      key: 'vault',
      label: t('featVault', language),
      description: t('featVaultDesc', language),
      icon: <Lock className="w-4 h-4" />,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      key: 'toc',
      label: t('featToc', language),
      description: t('featTocDesc', language),
      icon: <ListTree className="w-4 h-4" />,
      color: 'text-violet-500 bg-violet-500/10',
    },
    {
      key: 'databases',
      label: t('featDatabases', language),
      description: t('featDatabasesDesc', language),
      icon: <Table className="w-4 h-4" />,
      color: 'text-pink-500 bg-pink-500/10',
    },
    {
      key: 'templates',
      label: t('featTemplates', language),
      description: t('featTemplatesDesc', language),
      icon: <Layout className="w-4 h-4" />,
      color: 'text-blue-500 bg-blue-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1a1b24] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2e3146] flex flex-col max-h-[85vh] overflow-hidden"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="h-14 px-6 border-b border-gray-200 dark:border-[#282a3c] flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {t('settingsAndUpdates', language)}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                Nota v{CURRENT_VERSION}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252738] text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-gray-100 dark:border-[#282a3c] bg-gray-50/50 dark:bg-[#15161f] text-xs">
          <button
            onClick={() => setActiveTab('features')}
            className={`flex items-center gap-2 py-3 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'features'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{t('tabFeatures', language)}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('updates');
              if (!updateResult && !isChecking) handleCheckUpdates();
            }}
            className={`flex items-center gap-2 py-3 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'updates'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('tabUpdates', language)}</span>
          </button>
        </div>

        {/* Tab 1: Feature Customization */}
        {activeTab === 'features' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#282a3c]">
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  {t('featureCustomization', language)}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('featureCustomizationDesc', language)}
                </p>
              </div>
              <button
                onClick={onResetFeatures}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252738] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('resetAllFeatures', language)}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {FEATURE_ITEMS.map((item) => {
                const isEnabled = features[item.key];

                return (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isEnabled
                        ? 'bg-white dark:bg-[#20212d] border-gray-200 dark:border-[#303348]'
                        : 'bg-gray-50 dark:bg-[#15161f] border-gray-200/60 dark:border-[#202230] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4 rtl:pr-0 rtl:pl-4">
                      <div className={`p-2 rounded-lg ${item.color} shrink-0`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => onToggleFeature(item.key)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isEnabled
                            ? language === 'ar' ? '-translate-x-5' : 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Check for Updates */}
        {activeTab === 'updates' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Version Card */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#20212d] border border-gray-200 dark:border-[#303348] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  {t('currentVersion', language)}
                </span>
                <div className="text-xl font-extrabold text-gray-900 dark:text-white font-mono mt-0.5">
                  v{CURRENT_VERSION}
                </div>
              </div>
              <button
                onClick={handleCheckUpdates}
                disabled={isChecking}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? t('checkingForUpdates', language) : t('checkForUpdates', language)}</span>
              </button>
            </div>

            {/* Result Area */}
            {updateResult && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {updateResult.hasUpdate ? (
                  <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/40 text-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{t('updateAvailable', language)}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                            v{updateResult.latestVersion}
                          </span>
                        </div>
                        <p className="text-gray-400 mt-0.5">
                          {t('updateAvailableDesc', language)}
                        </p>
                      </div>
                    </div>

                    {updateResult.releaseNotes && (
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px] text-gray-300 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {updateResult.releaseNotes}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={updateResult.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/40"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t('downloadUpdate', language)}</span>
                      </a>
                      <a
                        href={updateResult.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#383a4f] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252738] text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{t('viewReleaseNotes', language)}</span>
                      </a>
                    </div>
                  </div>
                ) : updateResult.error ? (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{updateResult.error}</span>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{t('upToDate', language)}</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('upToDateDesc', language)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#15161f] border-t border-gray-100 dark:border-[#282a3c] flex items-center justify-between text-xs text-gray-400">
          <span className="font-mono text-[11px]">Nota • GNU GPLv3 Local-First</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-200 dark:bg-[#252738] hover:bg-gray-300 dark:hover:bg-[#303348] text-gray-700 dark:text-gray-200 font-medium transition-colors cursor-pointer"
          >
            {t('close', language)}
          </button>
        </div>
      </div>
    </div>
  );
};
