import React from 'react';
import { motion } from 'motion/react';
import { Quote, Calendar, BookMarked, Library } from 'lucide-react';
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
      if (!trimmed) return null;

      if (trimmed.startsWith('###')) {
        return (
          <div key={`div-${lineIdx}`} className="khutbah-divider">
            <span className="khutbah-title-text">{trimmed.replace(/###/g, '').trim()}</span>
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
              onClick={(e) => {
                e.stopPropagation();
                if (num) scrollToRef(`ref-${num}`);
              }}
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
        <p key={`line-${lineIdx}`} className={`text-justify mb-2 ${isStreaming && lineIdx === lines.length - 1 ? 'animate-in' : ''}`}>
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
      className={`w-full max-w-[210mm] bg-white dark:bg-slate-800 shadow-2xl p-4 md:p-6 border border-slate-200 dark:border-slate-800 rounded-lg relative preview-paper font-${fontStyle}`}
      style={{ fontSize: `${fontSize}pt`, lineHeight: lineHeight }}
    >
      {/* Integrated Professional Paper Header */}
      <div className="mb-6 border-b border-slate-100 dark:border-slate-800/40 pb-3 flex justify-between items-end relative min-h-[3.5rem]">
        
        {/* Right side: Preacher & Hijri Date */}
        <div className="flex flex-col gap-0.5 w-1/3 text-right z-10">
          <div 
            className={`text-[9px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all ${isManualEdit ? 'ring-2 ring-emerald-500/10 rounded-lg p-1 bg-white dark:bg-slate-800 shadow-sm' : ''}`}
            contentEditable={isManualEdit}
            suppressContentEditableWarning
          >
            <Quote size={10} className="text-emerald-600/60 shrink-0" />
            <span className="truncate">{profile?.displayName || 'اسم الواعظ'}</span>
          </div>
          <div className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
             <Calendar size={10} className="shrink-0 opacity-40" />
             <span>{new Intl.DateTimeFormat('ar-SA-u-ca-islamic-uma', {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date())}</span>
          </div>
        </div>

        {/* Center: Title (Compact & Prominent) */}
        <div className="text-center absolute left-1/2 -translate-x-1/2 w-1/3 bottom-3 z-10">
          <h1 
            className={`text-[11pt] md:text-[13pt] font-black text-slate-900 dark:text-white leading-tight outline-none tracking-tight transition-all ${isManualEdit ? 'bg-emerald-50 dark:bg-emerald-900/10 rounded-xl px-3 py-1 ring-1 ring-emerald-500/20 shadow-sm' : ''}`}
            contentEditable={isManualEdit}
            suppressContentEditableWarning
          >
            {title || 'موضوع المحاضرة'}
          </h1>
          <div className="h-[1.5px] w-6 bg-emerald-500/30 mx-auto mt-1 rounded-full" />
        </div>

        {/* Left side: App Info & Link */}
        <div className="text-left w-1/3 flex flex-col items-end z-10">
           <div className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-tighter flex items-center gap-1.5">
             <BookMarked size={12} className="shrink-0" />
             <span>معين الواعظ</span>
           </div>
           <div className="text-[7px] text-slate-400 dark:text-slate-500 font-bold leading-none mt-0.5">مساعدك الشرعي الذكي</div>
           <a 
            href="https://moeen-alwaiz.vercel.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[6.5px] text-emerald-600/30 dark:text-emerald-500/20 font-mono mt-1 hover:text-emerald-600 transition-colors no-print"
           >
             moeen-alwaiz.vercel.app
           </a>
        </div>

        {/* Subtle Decorative Background Element (Islamic Touch) */}
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="w-24 h-24 border border-emerald-500 rotate-45 transform scale-150 rounded-lg" />
          <div className="absolute w-24 h-24 border border-emerald-500 transform scale-150 rounded-lg" />
        </div>
      </div>

      <div 
        className={`outline-none typing-container ${isStreaming ? 'streaming opacity-90' : ''} ${isManualEdit ? 'ring-2 ring-emerald-500/10 p-6 rounded-3xl bg-slate-50/10 dark:bg-slate-900/10 backdrop-blur-sm' : ''} paper-content`}
        contentEditable={isManualEdit}
        suppressContentEditableWarning
        onBlur={e => onContentChange(e.currentTarget.innerText)}
      >
        {parseSemanticText(mainBody)}
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
