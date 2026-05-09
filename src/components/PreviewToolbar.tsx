import React from 'react';
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
  const fontSize = profile?.settings.fontSize || 14;

  return (
    <div className="w-full sticky top-0 z-[500] no-print">
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <button 
          onClick={onBack} 
          className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg dark:text-white hover:bg-slate-100 transition-colors"
          title="العودة"
        >
          <ChevronRight size={18} />
        </button>

        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/20 p-0.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner max-w-full overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setIsManualEdit(!isManualEdit)}
            className={`p-2 rounded-lg transition-all ${isManualEdit ? 'bg-emerald-600 text-white shadow-lg scale-90' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            title="تعديل يدوي"
          >
            {isManualEdit ? <Lock size={14}/> : <Edit3 size={14}/>}
          </button>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

          {/* Line Height Popover */}
          <div className="relative group">
            <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="تباعد الأسطر">
              <AlignJustify size={14} />
            </button>
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1 hidden group-hover:block transition-all z-[1000] min-w-[120px]">
              {LINE_HEIGHT_OPTIONS.map(lh => (
                <button 
                  key={lh.val} 
                  onClick={() => updateProfile({ settings: { ...profile!.settings, lineHeight: lh.val }})}
                  className={`w-full text-right px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${profile?.settings.lineHeight === lh.val ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200'}`}
                >
                  <span className="ml-2 opacity-50">{toArabicDigits(lh.val.toFixed(1))}</span>
                  {lh.name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

          <div className="flex items-center">
            <button 
              onClick={() => updateProfile({ settings: { ...profile!.settings, fontSize: fontSize + 1 }})}
              className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <Plus size={12} />
            </button>
            <span className="text-[10px] font-black dark:text-white px-1 min-w-[18px] text-center">{toArabicDigits(fontSize)}</span>
            <button 
              onClick={() => updateProfile({ settings: { ...profile!.settings, fontSize: Math.max(6, fontSize - 1) }})}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
            >
              <Minus size={12} />
            </button>
          </div>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

          <div className="relative group">
            <button 
              className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
              title="تغيير الخط"
            >
              <FontIcon size={14}/>
            </button>
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1 hidden group-hover:block transition-all z-[1000] min-w-[130px]">
              {FONT_OPTIONS.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => updateProfile({ settings: { ...profile!.settings, fontStyle: f.id }})}
                  className={`w-full text-right px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${profile?.settings.fontStyle === f.id ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200'}`}
                  style={{ fontFamily: f.id }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={onPrint} 
          className="p-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg shadow-lg transition-transform active:scale-95"
          title="طباعة"
        >
          <FileDown size={18}/>
        </button>
      </header>
    </div>
  );
};
