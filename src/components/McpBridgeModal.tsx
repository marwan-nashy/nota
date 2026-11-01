import React, { useState } from 'react';
import { 
  Bot, Terminal, Copy, Check, Download, Play, RefreshCw, X, Shield, Sparkles, Code
} from 'lucide-react';
import { Workspace } from '../types';
import { handleMcpRequest, generateStandaloneMcpScript, JsonRpcRequest } from '../services/mcpServer';
import { exportWorkspaceJSON } from '../services/storage';
import { t, Language } from '../i18n';

interface McpBridgeModalProps {
  isOpen: boolean;
  workspace: Workspace;
  language?: Language;
  onClose: () => void;
}

export const McpBridgeModal: React.FC<McpBridgeModalProps> = ({
  isOpen,
  workspace,
  language = 'en',
  onClose,
}) => {
  const [selectedTool, setSelectedTool] = useState<string>('nota_list_pages');
  const [paramInput, setParamInput] = useState<string>('{"query": "welcome"}');
  const [testOutput, setTestOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const claudeConfigSnippet = `{
  "mcpServers": {
    "nota": {
      "command": "node",
      "args": ["${navigator.platform.includes('Win') ? 'C:\\\\nota-mcp-server.js' : '/usr/local/bin/nota-mcp-server.js'}", "./nota-workspace.json"]
    }
  }
}`;

  const handleRunTest = async () => {
    setIsLoading(true);
    let parsedParams: any = {};
    if (selectedTool === 'nota_search_notes' || selectedTool === 'nota_get_page') {
      try {
        parsedParams = JSON.parse(paramInput);
      } catch {
        parsedParams = { query: paramInput, pageId: paramInput };
      }
    }

    const req: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: selectedTool,
        arguments: parsedParams,
      },
    };

    const res = await handleMcpRequest(req, workspace);
    setTestOutput(JSON.stringify(res, null, 2));
    setIsLoading(false);
  };

  const handleDownloadScript = () => {
    const script = generateStandaloneMcpScript();
    const blob = new Blob([script], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nota-mcp-server.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(claudeConfigSnippet);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2e2e2e] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2e2e2e]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 dark:text-violet-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {language === 'ar' ? 'جسر الذكاء الاصطناعي (MCP Server)' : 'Model Context Protocol (MCP) AI Bridge'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'ar'
                  ? 'ربط مساحة عملك مباشرة مع Claude Desktop و Antigravity وأدوات الذكاء الاصطناعي'
                  : 'Connect Claude Desktop, Antigravity, and AI agents directly to your offline vault'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Explanation */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-violet-500/20 bg-violet-500/5 text-xs text-gray-600 dark:text-gray-300">
            <Shield className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
            <div>
              <b>{language === 'ar' ? 'خصوصية 100% بدون خوادم سحابية:' : '100% Local Privacy:'}</b>{' '}
              {language === 'ar'
                ? 'يوفر خادم MCP وصولاً منظماً للمساعدين الذكيين لقراءة ملاحظاتك والبحث فيها عبر بروتوكول JSON-RPC بدون إرسال بياناتك لأي جهة خارجية.'
                : 'Exposes your vault to AI coding assistants via standard JSON-RPC 2.0 tools (list pages, search notes, inspect markdown) completely on your local machine.'}
            </div>
          </div>

          {/* Interactive Test Console */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#202020] space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-200">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-violet-500" />
                <span>{language === 'ar' ? 'منصة اختبار أدوات MCP التفاعلية' : 'Live MCP Tool Tester'}</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400">JSON-RPC 2.0</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Select Tool:</label>
                <select
                  value={selectedTool}
                  onChange={(e) => {
                    setSelectedTool(e.target.value);
                    if (e.target.value === 'nota_search_notes') setParamInput('{"query": "welcome", "limit": 3}');
                    else if (e.target.value === 'nota_get_page') setParamInput('{"pageId": "welcome-page"}');
                    else setParamInput('{}');
                  }}
                  className="w-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-mono text-gray-800 dark:text-gray-200 focus:outline-none"
                >
                  <option value="nota_list_pages">nota_list_pages (List all notes)</option>
                  <option value="nota_search_notes">nota_search_notes (BM25 search)</option>
                  <option value="nota_get_page">nota_get_page (Get markdown text)</option>
                  <option value="nota_list_tasks">nota_list_tasks (Extract tasks)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Tool Arguments (JSON):</label>
                <input
                  type="text"
                  value={paramInput}
                  onChange={(e) => setParamInput(e.target.value)}
                  className="w-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-mono text-gray-800 dark:text-gray-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunTest}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تشغيل الاختبار' : 'Execute Tool Call'}</span>
              </button>
            </div>

            {testOutput && (
              <pre className="p-3 rounded-lg bg-black text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-gray-800">
                {testOutput}
              </pre>
            )}
          </div>

          {/* Setup Instructions for Claude Desktop */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {language === 'ar' ? 'تهيئة Claude Desktop أو أدوات الذكاء الاصطناعي:' : 'Claude Desktop & AI Setup:'}
            </h3>

            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#202020] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  claude_desktop_config.json
                </span>
                <button
                  onClick={handleCopyConfig}
                  className="flex items-center gap-1 text-[11px] text-violet-500 hover:text-violet-600 font-medium cursor-pointer"
                >
                  {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedConfig ? 'Copied!' : 'Copy Config'}</span>
                </button>
              </div>

              <pre className="p-3 rounded-lg bg-[#151515] text-gray-300 font-mono text-[11px] overflow-x-auto">
                {claudeConfigSnippet}
              </pre>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={handleDownloadScript}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 dark:bg-[#2e2e2e] hover:bg-gray-300 dark:hover:bg-[#383838] text-xs font-medium text-gray-800 dark:text-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تحميل كود nota-mcp-server.js' : 'Download nota-mcp-server.js'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
