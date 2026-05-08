import React from 'react';
import { motion } from 'motion/react';
import { Quote, Calendar, Library } from 'lucide-react';
import { UserProfile, Section } from '../types';

interface SermonPaperProps {
  content: string;
  title: string;
  profile: UserProfile | null;
  view: Section;
  isStreaming: boolean;
  isManualEdit: boolean;
  onContentChange: (text: string) => void;
}

export const SermonPaper: React.FC<SermonPaperProps> = ({ 
  content, title, profile, view, isStreaming, isManualEdit, onContentChange 
}) => {
  const parts = content.split('----المصادر والمراجع----');
  const mainBody = parts[0];
  const sourcesText = parts[1] || '';

  const fontSize = profile?.settings.fontSize || 14;
  const fontStyle = profile?.settings.fontStyle || 'lateef';
  const lineHeight = profile?.settings.lineHeight || 1.6;

  const scrollToRef = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ref-highlight');
      setTimeout(() => el.classList.remove('ref-highlight'), 2000);
    }
  };

  const toArabicDigits = (num: number | string) => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (isNaN(n)) return num.toString();
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return n.toString().split('').map(d => arabic[parseInt(d)] || d).join('');
  };

  const parseSemanticText = (text: string) => {
    if (!text) return [];
    
    // Regex for semantic elements
    const regex = /(﴿[^﴾]+﴾|«[^»]+»|“[^”]+”|\[\d+\])/g;
    const lines = text.split('\n');
    
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={`empty-${lineIdx}`} className="h-4" />;

      if (trimmed.includes('الخطبة الأولى') || trimmed.includes('الخطبة الثانية')) {
        return (
          <div key={`div-${lineIdx}`} className="khutbah-divider">
            <span className="khutbah-title-text">{trimmed}</span>
          </div>
        );
      }

      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          elements.push(line.substring(lastIndex, match.index));
        }

        const found = match[0];
        if (found.startsWith('﴿')) {
          elements.push(<span key={match.index} className="quran-verse">{found}</span>);
        } else if (found.startsWith('«')) {
          elements.push(<span key={match.index} className="hadith-text">{found}</span>);
        } else if (found.startsWith('“')) {
          elements.push(<span key={match.index} className="quote-text">{found}</span>);
        } else if (found.startsWith('[')) {
          const numMatch = found.match(/\d+/);
          const num = numMatch ? numMatch[0] : '';
          elements.push(
            <span 
              id={`cite-${num}`}
              key={match.index} 
              className="source-ref"
              onClick={() => num && scrollToRef(`ref-${num}`)}
            >
              {found}
            </span>
          );
        }

        lastIndex = match.index + found.length;
      }

      if (lastIndex < line.length) {
        elements.push(line.substring(lastIndex));
      }

      return (
        <p key={`line-${lineIdx}`} className="text-justify indent-4 mb-2 animate-in">
          {elements}
        </p>
      );
    });
  };

  return (
    <motion.div 
      layout
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`w-full max-w-[210mm] bg-white dark:bg-slate-800 shadow-2xl p-4 md:p-8 border border-slate-200 dark:border-slate-800 rounded-lg relative min-h-[500px] preview-paper font-${fontStyle}`}
      style={{ fontSize: `${fontSize}pt`, lineHeight: lineHeight }}
    >
      {/* Redesigned Paper Header */}
      <div className="flex justify-between items-center mb-10 border-b border-slate-100 dark:border-slate-700 pb-4 relative h-16">
        <div className="flex flex-col gap-0.5 w-1/4">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 truncate">
            <Quote size={10} className="text-emerald-500 shrink-0" />
            <span className="truncate">{profile?.displayName}</span>
          </div>
          <div className="text-[9px] font-bold text-slate-300 dark:text-slate-600 flex items-center gap-1.5">
             <Calendar size={10} className="shrink-0" />
             <span>{new Date().toLocaleDateString('ar-SA')}</span>
          </div>
        </div>

        <div className="text-center absolute left-1/2 -translate-x-1/2 w-1/2">
          <h1 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
            {title}
          </h1>
        </div>

        <div className="text-left w-1/4 flex flex-col items-end">
           <div className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter no-print">تطبيق معين الواعظ</div>
           <div className="text-[7px] text-slate-300 dark:text-slate-600 font-bold">المساعد الرقمي الشرعي</div>
        </div>
      </div>

      <div 
        className={`outline-none min-h-[300px] typing-container ${isStreaming ? 'streaming' : ''} ${isManualEdit ? 'ring-1 ring-emerald-500/20 p-4 rounded-xl bg-slate-50/20 dark:bg-slate-900/10' : ''}`}
        contentEditable={isManualEdit}
        suppressContentEditableWarning
        onBlur={e => onContentChange(e.currentTarget.innerText)}
      >
        {parseSemanticText(mainBody)}
        {isStreaming && <span className="inline-block w-1.5 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle"></span>}
      </div>

      {sourcesText && (
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 no-print">
          <h5 className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] mb-4 flex items-center gap-2">
            <Library size={14} /> قائمة المصادر والمراجع:
          </h5>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl text-[9px] text-slate-600 dark:text-slate-400 font-sans border border-slate-100 dark:border-slate-800 shadow-inner leading-relaxed overflow-hidden">
            {sourcesText.trim().split('\n').map((s, idx) => {
              const numMatch = s.match(/^\[(\d+)\]/);
              const num = numMatch ? numMatch[1] : null;
              return (
                <div 
                  id={num ? `ref-${num}` : undefined}
                  key={idx} 
                  className="mb-2 flex gap-3 ref-item cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-1 rounded-lg transition-all"
                  onClick={() => num && scrollToRef(`cite-${num}`)}
                >
                  <span className="text-emerald-600 font-bold shrink-0">{num ? `[${toArabicDigits(num)}]` : '•'}</span>
                  <span className="flex-1">{s.replace(/^\[\d+\]\s*/, '').trim()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};
