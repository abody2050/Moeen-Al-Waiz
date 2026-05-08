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

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({ 
  onBack, isManualEdit, setIsManualEdit, profile, updateProfile, onPrint 
}) => {
  const fontSize = profile?.settings.fontSize || 14;

  return (
    <div className="fixed top-0 left-0 right-0 z-[500] no-print px-4 py-3">
      <header className="max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
        <button 
          onClick={onBack} 
          className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white hover:bg-slate-100 transition-colors"
          title="العودة"
        >
          <ChevronRight size={20} />
        </button>

        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setIsManualEdit(!isManualEdit)}
            className={`p-2 rounded-lg transition-all ${isManualEdit ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            title="تعديل يدوي"
          >
            {isManualEdit ? <Lock size={16}/> : <Edit3 size={16}/>}
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div className="flex items-center gap-2 px-1">
            <AlignJustify size={14} className="text-slate-400" />
            <select 
              className="bg-transparent outline-none text-[10px] font-bold dark:text-white cursor-pointer"
              value={profile?.settings.lineHeight}
              onChange={(e) => updateProfile({ settings: { ...profile!.settings, lineHeight: parseFloat(e.target.value) }})}
            >
              {[1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4].map(lh => (
                <option key={lh} value={lh}>{toArabicDigits(lh.toFixed(1))}</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => updateProfile({ settings: { ...profile!.settings, fontSize: fontSize + 1 }})}
              className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <Plus size={14} />
            </button>
            <span className="text-[10px] font-bold dark:text-white px-1 min-w-[20px] text-center">{toArabicDigits(fontSize)}</span>
            <button 
              onClick={() => updateProfile({ settings: { ...profile!.settings, fontSize: Math.max(6, fontSize - 1) }})}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
            >
              <Minus size={14} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div className="relative group">
            <button 
              className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
              title="تغيير الخط"
            >
              <FontIcon size={16}/>
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1 hidden group-hover:block transition-all z-[1000] min-w-[140px]">
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
          className="p-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl shadow-lg transition-transform active:scale-95"
          title="طباعة"
        >
          <FileDown size={18}/>
        </button>
      </header>
    </div>
  );
};
