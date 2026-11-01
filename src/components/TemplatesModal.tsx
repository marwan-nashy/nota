import React from 'react';
import { 
  X, CheckSquare, Calendar, BookOpen, Target, Sparkles, Layout, Flame, Compass
} from 'lucide-react';
import { Block } from '../types';
import { nanoid } from 'nanoid';
import { t, Language } from '../i18n';

interface TemplatesModalProps {
  isOpen: boolean;
  language?: Language;
  onClose: () => void;
  onApplyTemplate: (title: string, icon: string, cover: string | null, blocks: Block[]) => void;
}

export const TEMPLATES_EN = [
  {
    id: 'tpl-meeting',
    name: 'Meeting Notes',
    description: 'Capture agenda, attendee discussion, decisions, and action items.',
    icon: '📝',
    cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    blocks: [
      { id: 'b1', type: 'callout', icon: '📅', content: `<b>Date:</b> ${new Date().toLocaleDateString()} &nbsp;|&nbsp; <b>Participants:</b> Product, Engineering, Design` },
      { id: 'b2', type: 'heading2', content: '🎯 Goals & Agenda' },
      { id: 'b3', type: 'bullet', content: 'Review potato PC performance metrics & memory profiling' },
      { id: 'b4', type: 'bullet', content: 'Align on Q4 feature releases & modular block parity' },
      { id: 'b5', type: 'heading2', content: '💬 Discussion & Key Decisions' },
      { id: 'b6', type: 'paragraph', content: 'We verified sub-35MB RAM consumption and zero Electron bloat.' },
      { id: 'b7', type: 'heading2', content: '✅ Action Items' },
      { id: 'b8', type: 'todo', checked: false, content: 'Verify responsive keyboard navigation on low-end hardware' },
      { id: 'b9', type: 'todo', checked: false, content: 'Export release notes as clean Markdown' },
    ]
  },
  {
    id: 'tpl-reading',
    name: 'Reading & Knowledge List',
    description: 'Keep track of articles, books, papers, and key takeaways.',
    icon: '📚',
    cover: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)',
    blocks: [
      { id: 'b1', type: 'callout', icon: '💡', content: '<i>"A reader lives a thousand lives before he dies."</i> — George R.R. Martin' },
      { id: 'b2', type: 'heading2', content: 'Currently Reading' },
      { id: 'b3', type: 'todo', checked: false, content: '<b>Designing Data-Intensive Applications</b> by Martin Kleppmann' },
      { id: 'b4', type: 'todo', checked: true, content: '<b>Clean Architecture</b> by Robert C. Martin' },
      { id: 'b5', type: 'heading2', content: 'Key Learnings & Quotes' },
      { id: 'b6', type: 'quote', content: 'Reliability is keeping systems running correctly even in the face of adversity.' },
      { id: 'b7', type: 'divider', content: '' },
      { id: 'b8', type: 'heading3', content: 'Up Next' },
      { id: 'b9', type: 'bullet', content: 'The Pragmatic Programmer (20th Anniversary Edition)' },
    ]
  },
  {
    id: 'tpl-habits',
    name: 'Weekly Goals & Habit Tracker',
    description: 'Build consistency with daily tracking and weekly reviews.',
    icon: '🎯',
    cover: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    blocks: [
      { id: 'b1', type: 'callout', icon: '🔥', content: '<b>Weekly Focus:</b> Consistent execution and ruthless prioritization.' },
      { id: 'b2', type: 'heading2', content: 'Daily Habits Checklist' },
      { id: 'b3', type: 'todo', checked: true, content: 'Deep work block (90 mins without distractions)' },
      { id: 'b4', type: 'todo', checked: true, content: 'Physical exercise & 8,000 steps' },
      { id: 'b5', type: 'todo', checked: false, content: 'Read 20 pages of technical book' },
      { id: 'b6', type: 'todo', checked: false, content: 'Zero screen time 1 hour before bed' },
      { id: 'b7', type: 'heading2', content: 'Weekly Wins & Reflection' },
      { id: 'b8', type: 'quote', content: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.' },
    ]
  },
  {
    id: 'tpl-scratchpad',
    name: 'Brainstorm & Ideas Scratchpad',
    description: 'Fast, freeform playground for fleeting thoughts and code snippets.',
    icon: '⚡',
    cover: null,
    blocks: [
      { id: 'b1', type: 'callout', icon: '🧠', content: 'Use this scratchpad to dump thoughts quickly. Everything auto-saves instantly.' },
      { id: 'b2', type: 'heading2', content: 'Raw Ideas' },
      { id: 'b3', type: 'bullet', content: 'Local SQLite engine with full-text search' },
      { id: 'b4', type: 'bullet', content: 'Offline bidirectional link graph view' },
      { id: 'b5', type: 'heading2', content: 'Code Snippets' },
      { id: 'b6', type: 'code', language: 'typescript', content: '// Fast zero-copy memory structure\ninterface LightweightBlock {\n  id: string;\n  content: string;\n}' },
    ]
  }
];

export const TEMPLATES_AR = [
  {
    id: 'tpl-meeting-ar',
    name: 'محضر وملاحظات الاجتماع',
    description: 'توثيق الأجندة، نقاشات الحاضرين، القرارات المتخذة، والمهام التنفيذية.',
    icon: '📝',
    cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    blocks: [
      { id: 'b1', type: 'callout', icon: '📅', content: `<b>التاريخ:</b> ${new Date().toLocaleDateString('ar-EG')} &nbsp;|&nbsp; <b>المشاركون:</b> إدارة المنتج، الهندسة البرمجية، التصميم` },
      { id: 'b2', type: 'heading2', content: '🎯 الأهداف وجدول الأعمال' },
      { id: 'b3', type: 'bullet', content: 'مراجعة مؤشرات الأداء واستهلاك الذاكرة على الأجهزة الضعيفة' },
      { id: 'b4', type: 'bullet', content: 'تنسيق خطة إطلاق المميزات ودعم اللغة العربية الكامل' },
      { id: 'b5', type: 'heading2', content: '💬 المناقشات والقرارات الحاسمة' },
      { id: 'b6', type: 'paragraph', content: 'تم التأكد من استهلاك أقل من 35 ميجابايت من الذاكرة العشوائية وسرعة استجابة فورية.' },
      { id: 'b7', type: 'heading2', content: '✅ المهام وخطوات العمل' },
      { id: 'b8', type: 'todo', checked: false, content: 'فحص التنقل التفاعلي وسرعة واجهة المستخدم' },
      { id: 'b9', type: 'todo', checked: false, content: 'تصدير وثائق التحديثات بصيغة Markdown نظيفة' },
    ]
  },
  {
    id: 'tpl-reading-ar',
    name: 'قائمة القراءة وتوثيق المعرفة',
    description: 'متابعة الكتب والمقالات والأفكار المستخلصة والاقتباسات الملهمة.',
    icon: '📚',
    cover: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)',
    blocks: [
      { id: 'b1', type: 'callout', icon: '💡', content: '<i>"القارئ يعيش ألف حياة قبل أن يموت، أما من لا يقرأ فيعيش حياة واحدة فقط."</i>' },
      { id: 'b2', type: 'heading2', content: 'أقرأ حالياً' },
      { id: 'b3', type: 'todo', checked: false, content: '<b>تصميم التطبيقات المعتمدة على البيانات الضخمة</b>' },
      { id: 'b4', type: 'todo', checked: true, content: '<b>العمارة البرمجية النظيفة (Clean Architecture)</b>' },
      { id: 'b5', type: 'heading2', content: 'أهم الأفكار والاقتباسات' },
      { id: 'b6', type: 'quote', content: 'الموثوقية هي الحفاظ على استقرار النظام وكفاءته حتى في أصعب الظروف.' },
      { id: 'b7', type: 'divider', content: '' },
      { id: 'b8', type: 'heading3', content: 'الكتب القادمة' },
      { id: 'b9', type: 'bullet', content: 'المبرمج البراغماتي (The Pragmatic Programmer)' },
    ]
  },
  {
    id: 'tpl-habits-ar',
    name: 'متابع الأهداف والعادات الأسبوعية',
    description: 'بناء الانضباط الذاتي عبر التتبع اليومي والمراجعة الأسبوعية.',
    icon: '🎯',
    cover: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    blocks: [
      { id: 'b1', type: 'callout', icon: '🔥', content: '<b>التركيز الأسبوعي:</b> التنفيذ المستمر وتحديد الأولويات بدقة وبدون تشتت.' },
      { id: 'b2', type: 'heading2', content: 'قائمة العادات اليومية' },
      { id: 'b3', type: 'todo', checked: true, content: 'جلسة تركيز عميق (90 دقيقة عمل متواصل دون تشتت)' },
      { id: 'b4', type: 'todo', checked: true, content: 'ممارسة الرياضة والمشي 8,000 خطوة' },
      { id: 'b5', type: 'todo', checked: false, content: 'قراءة 20 صفحة من كتاب تقني أو معرفي' },
      { id: 'b6', type: 'todo', checked: false, content: 'الابتعاد عن الشاشات قبل النوم بساعة' },
      { id: 'b7', type: 'heading2', content: 'مراجعة إنجازات الأسبوع' },
      { id: 'b8', type: 'quote', content: 'نحن حصيلة ما نفعله بتكرار. التميز إذن ليس فعلاً عابراً، بل عادة متأصلة.' },
    ]
  },
  {
    id: 'tpl-scratchpad-ar',
    name: 'مسودة الأفكار والعصف الذهني',
    description: 'مساحة حرة وسريعة لتدوين الأفكار العابرة والخواطر التقنية.',
    icon: '⚡',
    cover: null,
    blocks: [
      { id: 'b1', type: 'callout', icon: '🧠', content: 'استخدم هذه المسودة لتدوين الأفكار فور ورودها. يتم الحفظ التلقائي فوراً.' },
      { id: 'b2', type: 'heading2', content: 'أفكار أولية' },
      { id: 'b3', type: 'bullet', content: 'محرك محلي فائق السرعة يدعم البحث اللحظي' },
      { id: 'b4', type: 'bullet', content: 'مخطط بياني ترابطي للصفحات يعمل دون إنترنت' },
      { id: 'b5', type: 'heading2', content: 'مقتطفات برمجية' },
      { id: 'b6', type: 'code', language: 'typescript', content: '// بنية بيانات خفيفة الذاكرة\ninterface LightweightBlock {\n  id: string;\n  content: string;\n}' },
    ]
  }
];

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  language = 'en',
  onClose,
  onApplyTemplate,
}) => {
  if (!isOpen) return null;

  const templates = language === 'ar' ? TEMPLATES_AR : TEMPLATES_EN;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="font-bold text-sm text-[#37352f] dark:text-[#ebebeb]">{t('starterTemplates', language)}</h2>
              <p className="text-[11px] text-gray-400">{t('starterTemplatesDesc', language)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                const generatedBlocks = tpl.blocks.map((b) => ({
                  ...b,
                  id: 'b-' + nanoid(6),
                })) as Block[];
                onApplyTemplate(tpl.name, tpl.icon, tpl.cover, generatedBlocks);
                onClose();
              }}
              className="p-4 rounded-xl border border-[#e9e9e7] dark:border-[#383838] bg-[#fbfbfa] dark:bg-[#202020] hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl mb-2 select-none group-hover:scale-110 transition-transform origin-start">
                  {tpl.icon}
                </div>
                <h3 dir="auto" className="font-semibold text-xs text-[#37352f] dark:text-[#ebebeb] mb-1">
                  {tpl.name}
                </h3>
                <p dir="auto" className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-[#2a2a2a] text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center justify-between">
                <span>{t('useTemplate', language)}</span>
                <span className="rtl:rotate-180 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
