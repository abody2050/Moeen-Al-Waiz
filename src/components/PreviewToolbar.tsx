import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, Edit3, Lock, 
  AlignJustify, Plus, Minus, Type as FontIcon, 
  FileDown
} from 'lucide-react';
import { FontStyle, UserProfile } from '../types';

interface PreviewToolbarProps {
  onBack: () => void;
  isManualEdit: boolean;
  setIsManualEdit: (val: boolean) => void;
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => void;
  onPrint: () => void;
}

const FONT_OPTIONS: { id: FontStyle; name: string }[] = [
  { id: 'lateef', name: 'خط لطيف (رسمي)' },
  { id: 'scheherazade', name: 'خط المصحف' },
  { id: 'amiri', name: 'خط أميري' },
  { id: 'cairo', name: 'خط كايرو' },
  { id: 'tajawal', name: 'خط تجوال' },
  { id: 'vazir', name: 'خط وزير' },
];

const toArabicDigits = (num: number | string) => {
  const n = typeof num === 'string' ? parseInt(num) : num;
  if (isNaN(n)) return num.toString();
  const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return n.toString().split('').map(d => arabic[parseInt(d)] || d).join('');
};

const LINE_HEIGHT_OPTIONS = [
  { val: 1.0, name: 'مزداد ضيقاً' },
  { val: 1.2, name: 'ضيق' },
  { val: 1.4, name: 'متوازن' },
  { val: 1.6, name: 'افتراضي' },
  { val: 1.8, name: 'مريح' },
  { val: 2.0, name: 'واسع' },
  { val: 2.2, name: 'فائق الاتساع' },
];

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({ 
  onBack, isManualEdit, setIsManualEdit, profile, updateProfile, onPrint 
}) => {
  const [activePopover, setActivePopover] = useState<'font' | 'lineHeight' | null>(null);
  const fontSize = profile?.settings.fontSize || 14;

  const fontRef = useRef<HTMLDivElement>(null);
  const lhRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(event.target as Node) &&
          lhRef.current && !lhRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full sticky top-0 md:top-2 z-[500] no-print px-0 md:px-4 flex justify-center">
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b md:border md:rounded-[1.5rem] border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-[210mm]">
        <button 
          onClick={onBack} 
          className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white hover:bg-slate-100 transition-colors"
          title="العودة"
        >
          <ChevronRight size={18} />
        </button>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/20 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
          <button 
            onClick={() => setIsManualEdit(!isManualEdit)}
            className={`p-2.5 rounded-xl transition-all ${isManualEdit ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            title="تعديل يدوي"
          >
            {isManualEdit ? <Lock size={16}/> : <Edit3 size={16}/>}
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {/* Line Height Popover */}
          <div className="relative" ref={lhRef}>
            <button 
              onClick={() => setActivePopover(activePopover === 'lineHeight' ? null : 'lineHeight')}
              className={`p-2.5 rounded-xl transition-colors ${activePopover === 'lineHeight' ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30' : 'text-slate-400 hover:text-emerald-600'}`} 
              title="تباعد الأسطر"
            >
              <AlignJustify size={16} />
            </button>
            {activePopover === 'lineHeight' && (
              <div className="absolute top-full right-0 mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-[1000] min-w-[150px] animate-in">
                <div className="text-[9px] font-bold text-slate-400 mb-2 px-2 uppercase tracking-widest">المسافة بين الأسطر</div>
                {LINE_HEIGHT_OPTIONS.map(lh => (
                  <button 
                    key={lh.val} 
                    onClick={() => {
                      updateProfile({ settings: { ...profile!.settings, lineHeight: lh.val }});
                      setActivePopover(null);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-xl text-[11px] font-bold transition-colors mb-1 last:mb-0 ${profile?.settings.lineHeight === lh.val ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200'}`}
                  >
                    {lh.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl px-2 py-0.5">
            <button 
              onClick={() => updateProfile({ settings: { ...profile!.settings, fontSize: Math.min(15, fontSize + 1) }})}
              className="p-1 text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <Plus size={14} />
            </button>
            <input 
              type="number"
              min="0"
              max="15"
              value={fontSize}
              readOnly
              className="w-10 bg-transparent text-center text-xs font-black dark:text-white outline-none"
            />
            <button 
              onClick={() => updateProfile({ settings: { ...profile!.settings, fontSize: Math.max(0, fontSize - 1) }})}
              className="p-1 text-slate-500 hover:text-rose-600 transition-colors"
            >
              <Minus size={14} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {/* Font Popover */}
          <div className="relative" ref={fontRef}>
            <button 
              onClick={() => setActivePopover(activePopover === 'font' ? null : 'font')}
              className={`p-2.5 rounded-xl transition-colors ${activePopover === 'font' ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30' : 'text-slate-400 hover:text-emerald-600'}`}
              title="تغيير الخط"
            >
              <FontIcon size={16}/>
            </button>
            {activePopover === 'font' && (
              <div className="absolute top-full left-0 mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-[1000] min-w-[160px] animate-in overflow-hidden">
                <div className="text-[9px] font-bold text-slate-400 mb-2 px-2 uppercase tracking-widest">اختيار نوع الخط</div>
                <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                  {FONT_OPTIONS.map(f => (
                    <button 
                      key={f.id} 
                      onClick={() => {
                        updateProfile({ settings: { ...profile!.settings, fontStyle: f.id }});
                        setActivePopover(null);
                      }}
                      className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-colors mb-1 last:mb-0 ${profile?.settings.fontStyle === f.id ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200'}`}
                      style={{ fontFamily: f.id === 'lateef' ? 'Lateef' : f.id === 'amiri' ? 'Amiri' : f.id === 'scheherazade' ? 'Scheherazade New' : f.id === 'cairo' ? 'Cairo' : f.id === 'tajawal' ? 'Tajawal' : f.id === 'vazir' ? 'Vazirmatn' : 'inherit' }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={onPrint} 
          className="p-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl shadow-lg transition-transform active:scale-95"
          title="طباعة"
        >
          <FileDown size={20}/>
        </button>
      </header>
    </div>
  );
};

