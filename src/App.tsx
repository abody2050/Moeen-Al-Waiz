import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ScrollText, MessageSquare, BookOpen, Lightbulb, Bookmark, 
  Settings, Copy, Share2, 
  ChevronRight, ChevronLeft, Sparkles, RefreshCw,
  Plus, Timer,
  CheckCircle2, AlertCircle, LogOut,
  Quote, BookMarked
} from 'lucide-react';
import { usePreacher } from './hooks/usePreacher';
import { auth } from './lib/firebase';
import { getHijriDate } from './lib/dateUtils';
import { generateSermonStream, refineContent, SECTION_CONFIG } from './services/geminiService';
import { analyzeInput } from './services/safetyService';
import { Section, SavedContent, Notification } from './types';
import { PreviewToolbar } from './components/PreviewToolbar';
import { SermonPaper } from './components/SermonPaper';

const toArabicDigits = (num: number | string) => {
  const n = typeof num === 'string' ? parseInt(num) : num;
  if (isNaN(n)) return num.toString();
  const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return n.toString().split('').map(d => arabic[parseInt(d)] || d).join('');
};

const App = () => {
  const { user, profile, sermons, loading, signInWithGoogle, updateProfile, addSermon, deleteSermon } = usePreacher();
  const [view, setView] = useState<Section | 'home'>('home');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [isTitleManual, setIsTitleManual] = useState(false);
  const [duration, setDuration] = useState(15);
  const [instructions, setInstructions] = useState('');
  const [currentSermonDate, setCurrentSermonDate] = useState<string>('');
  const [editableContent, setEditableContent] = useState('');
  const [displayedContent, setDisplayedContent] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [setupName, setSetupName] = useState('');

  const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleGenerate = async () => {
    if (!formTitle) return addNotification('يرجى تحديد الموضوع أولاً', 'error');
    
    let currentTitle = formTitle;

    // Safety & Quality Analysis
    setIsThinking(true);
    try {
      const analysis = await analyzeInput(formTitle, instructions);
      
      if (analysis.status === 'REJECT') {
        setIsThinking(false);
        alert(`تنبيه هام: ${analysis.message}`);
        return;
      }
      
      if (analysis.status === 'VIOLATION') {
        setIsThinking(false);
        addNotification(analysis.message || 'المحتوى غير لائق', 'warning');
        return;
      }
      
      if (analysis.status === 'CLARIFY') {
        setIsThinking(false);
        addNotification(analysis.message || 'يرجى توضيح العنوان', 'info');
        return;
      }
      
      if (analysis.status === 'IMPROVE') {
        if (analysis.improvedTitle) {
          setFormTitle(analysis.improvedTitle);
          currentTitle = analysis.improvedTitle;
        }
        // Notification suppressed as per user request
      }
    } catch (err) {
      console.warn("Safety check failed, proceeding anyway...");
    }

    setIsStreaming(true); 
    setIsThinking(true);
    setEditableContent(''); 
    setDisplayedContent('');

    try {
      let fullText = '';
      let titleFound = false;
      const stream = generateSermonStream(view as Section, currentTitle, duration, instructions);

      for await (const chunk of stream) {
        if (isThinking) setIsThinking(false);
        fullText += chunk;

        if (!titleFound && !isTitleManual && fullText.includes('SUGGESTED_TITLE:')) {
          const titleMatch = fullText.match(/SUGGESTED_TITLE:\s*([^\n]+)/);
          if (titleMatch) {
            const newTitle = titleMatch[1].trim();
            setFormTitle(newTitle);
            currentTitle = newTitle;
            titleFound = true;
          }
        }

        const cleanText = fullText
          .replace(/SUGGESTED_TITLE:[^\n]*\n?/, '')
          .replace(/---FINISH---/, '');
        setEditableContent(cleanText);
      }
      
      const finalCleanText = fullText
        .replace(/SUGGESTED_TITLE:[^\n]*\n?/, '')
        .replace(/---FINISH---/, '');

      if (finalCleanText) {
        const hDate = getHijriDate();
        setCurrentSermonDate(hDate);
        const newSermon: SavedContent = {
          id: Date.now().toString(),
          title: currentTitle,
          type: view as Section,
          content: finalCleanText,
          date: hDate,
          userId: user?.uid || 'anon',
          preacherName: profile?.displayName,
          duration,
          instructions
        };
        await addSermon(newSermon);
        addNotification('اكتملت صياغة النص بكلمات بليغة', 'success');
      }
    } catch (error: any) {
      console.error(error);
      const errorDetail = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      addNotification(`خطأ: ${errorDetail}`, 'error');
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
    }
  };

  useEffect(() => {
    setDisplayedContent(editableContent);
  }, [editableContent]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <span className="text-sm font-bold text-slate-400">جاري التحميل...</span>
      </div>
    </div>
  );

  if (user && profile && !profile.setupComplete) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center border border-slate-700"
      >
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
          <BookMarked size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">مرحباً بك في معين الواعظ</h2>
        <p className="text-xs text-slate-500 mb-8 font-bold">يرجى كتابة اسمك الكريم الذي سيظهر كـ "واعظ" في جميع خطبك ومواعظك الموثقة</p>
        
        <div className="space-y-4">
          <input 
            type="text"
            placeholder="اسمك الكريم هنا..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 outline-none text-sm font-bold dark:text-white text-center"
            value={setupName}
            onChange={e => setSetupName(e.target.value)}
          />
          <button 
            disabled={!setupName.trim() || isThinking}
            onClick={async () => {
              setIsThinking(true);
              try {
                const safety = await analyzeInput(setupName, '');
                if (safety.status === 'REJECT' || safety.status === 'VIOLATION') {
                  addNotification(safety.message || 'يرجى اختيار اسم لائق', 'warning');
                  setIsThinking(false);
                  return;
                }
                updateProfile({ displayName: setupName, setupComplete: true });
              } catch (err) {
                updateProfile({ displayName: setupName, setupComplete: true });
              }
              setIsThinking(false);
            }}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isThinking && <RefreshCw size={18} className="animate-spin" />}
            إكمال الإعداد
          </button>
        </div>
      </motion.div>
    </div>
  );

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-slate-900 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center border border-slate-100 dark:border-slate-700"
      >
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center text-emerald-600 mx-auto mb-8 shadow-inner">
          <Sparkles size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">معين الواعظ</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          سجل دخولك الآن للبدء في صياغة الخطب والمواعظ بأسلوب بليغ وموثق، والوصول لسجلاتك من أي مكان.
        </p>
        <button 
          onClick={signInWithGoogle}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" className="w-5 h-5 bg-white p-1 rounded-full" alt="google" />
          الدخول بحساب جوجل
        </button>
      </motion.div>
    </div>
  );

  return (
    <main className={`max-w-4xl mx-auto min-h-screen ${profile?.settings.isDarkMode ? 'dark bg-slate-950' : 'bg-white'} relative shadow-2xl transition-colors font-sans`}>
      
      {/* Notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[3000] w-full max-w-sm px-4 pointer-events-none space-y-2">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
                n.type === 'success' ? 'bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' :
                n.type === 'error' ? 'bg-white dark:bg-slate-800 border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-300' :
                'bg-white dark:bg-slate-800 border-blue-100 dark:border-blue-900 text-blue-800 dark:text-blue-300'
              }`}
            >
              {n.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
              <span className="text-xs font-bold">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {view === 'home' && (
        <div className="flex flex-col min-h-screen pb-24 bg-slate-50 dark:bg-slate-900">
          <header className="px-6 pt-10 pb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg"><BookMarked size={24} /></div>
              <div>
                <h2 className="text-md font-bold text-slate-900 dark:text-white">معين الواعظ Pro</h2>
                <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-2">
                  <span>المعرف: {toArabicDigits(profile?.idNumber || '00000')}</span>
                  <span className="opacity-30">|</span>
                  <span>{profile?.displayName}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-400 hover:text-emerald-600 transition-colors">
              <Settings size={20} />
            </button>
          </header>

          <div className="px-6 py-4 grid grid-cols-2 gap-4">
            {Object.entries(SECTION_CONFIG).map(([key, cfg]) => {
              const IconComp = key === 'sermon' ? ScrollText : key === 'exhortation' ? MessageSquare : key === 'lesson' ? BookOpen : key === 'reflection' ? Lightbulb : Bookmark;
              return (
                <button key={key} onClick={() => { setView(key as Section); setEditableContent(''); setFormTitle(''); }} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-800 flex flex-col gap-4 hover:border-emerald-500 transition-all text-right group">
                  <div className={`p-4 w-fit rounded-2xl bg-slate-50 dark:bg-slate-900 ${cfg.text} group-hover:scale-110 transition-transform`}>
                    <IconComp size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{cfg.title}</h3>
                </button>
              );
            })}
          </div>

          <div className="px-6 mt-10">
            <h3 className="text-slate-900 dark:text-white font-bold text-xs mb-4 flex items-center gap-2 opacity-60">
              <RefreshCw size={14} className="text-emerald-500" /> آخر السجلات المحفوظة
            </h3>
            <div className="space-y-3">
              {sermons.map(s => {
                let pressTimer: any;
                let startPos = { x: 0, y: 0 };
                
                const startPress = (e: any) => {
                  const touch = e.touches ? e.touches[0] : e;
                  startPos = { x: touch.clientX, y: touch.clientY };
                  pressTimer = setTimeout(() => setLongPressId(s.id), 800);
                };
                
                const handleMove = (e: any) => {
                  const touch = e.touches ? e.touches[0] : e;
                  const dist = Math.sqrt(
                    Math.pow(touch.clientX - startPos.x, 2) + 
                    Math.pow(touch.clientY - startPos.y, 2)
                  );
                  if (dist > 10) clearTimeout(pressTimer);
                };

                const cancelPress = () => clearTimeout(pressTimer);

                return (
                  <div 
                    key={s.id} 
                    onClick={() => { if (!longPressId) { setEditableContent(s.content); setFormTitle(s.title); setView(s.type); setCurrentSermonDate(s.date); } }}
                    onMouseDown={startPress}
                    onMouseUp={cancelPress}
                    onMouseMove={handleMove}
                    onTouchStart={startPress}
                    onTouchEnd={cancelPress}
                    onTouchMove={handleMove}
                    className={`bg-white dark:bg-slate-800 p-4 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all group relative ${longPressId === s.id ? 'border-rose-500 scale-95' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
                  >
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-emerald-600">
                      <ScrollText size={18} />
                    </div>
                    <div className="flex-1 truncate">
                      <h4 className="font-bold text-xs dark:text-white truncate">{s.title}</h4>
                      <span className="text-[10px] text-slate-300 font-bold">{s.date}</span>
                    </div>
                    <ChevronLeft size={16} className="text-slate-200" />

                    <AnimatePresence>
                      {longPressId === s.id && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                          className="absolute inset-0 bg-rose-600 rounded-2xl flex items-center justify-around z-50 px-4"
                        >
                          <span className="text-[10px] font-bold text-white">هل تود الحذف؟</span>
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); deleteSermon(s.id); setLongPressId(null); addNotification('تم الحذف بنجاح', 'success'); }} className="bg-white text-rose-600 px-4 py-1.5 rounded-lg font-bold text-[10px]">نعم</button>
                            <button onClick={(e) => { e.stopPropagation(); setLongPressId(null); }} className="bg-rose-700 text-white px-4 py-1.5 rounded-lg font-bold text-[10px]">تراجع</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Generator Form */}
      {view !== 'home' && !editableContent && !isStreaming && (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
          <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-50 border-b border-slate-50 dark:border-slate-800">
            <button onClick={() => setView('home')} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600"><ChevronRight size={20} /></button>
            <h2 className="text-sm font-bold dark:text-white">{SECTION_CONFIG[view as Section]?.title}</h2>
            <div className="w-10 h-10 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <Sparkles size={20} />
            </div>
          </header>
          
          <div className="p-8 space-y-10 pb-32">
            <div className="space-y-3">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">موضوع الـ{SECTION_CONFIG[view as Section]?.label}</label>
               <input 
                type="text" 
                placeholder="عن ماذا تود الحديث اليوم؟" 
                className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 outline-none text-md font-bold dark:text-white shadow-inner" 
                value={formTitle} 
                onChange={e => { setFormTitle(e.target.value); setIsTitleManual(true); }} 
               />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
               <div className="flex items-center justify-between mb-6">
                  <label className="font-bold text-xs flex items-center gap-2 dark:text-white"><Timer size={16} className="text-emerald-600" /> مدة الإلقاء</label>
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold text-[11px]">{toArabicDigits(duration)} دقيقة</span>
               </div>
               <input type="range" min="5" max="60" step="5" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تعليمات شرعية أو توثيقية</label>
               <textarea 
                placeholder="مثال: استشهد بآية من سورة النور، اذكر قولاً لابن تيمية، ركز على جانب الشباب..." 
                className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 outline-none text-xs font-bold h-32 dark:text-white leading-relaxed shadow-inner" 
                value={instructions} 
                onChange={e => setInstructions(e.target.value)} 
               />
            </div>
          </div>

          <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-50">
            <button 
              onClick={handleGenerate}
              className="w-full bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
            >
              <Sparkles size={20} /> صياغة المحتوى بالذكاء الاصطناعي
            </button>
          </footer>
        </div>
      )}

      {/* Editor / Preview Area */}
      {(isStreaming || (editableContent && view !== 'home')) && (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col relative overflow-x-hidden">
          
          <PreviewToolbar 
            onBack={() => { setEditableContent(''); setDisplayedContent(''); setView('home'); setCurrentSermonDate(''); }}
            isManualEdit={isManualEdit}
            setIsManualEdit={setIsManualEdit}
            profile={profile}
            updateProfile={updateProfile}
            onPrint={() => window.print()}
          />

          {(isStreaming || isThinking) && <div className="ambient-glow" />}

          <div className="pt-12 md:pt-16 p-4 md:p-10 flex flex-col items-center w-full">
            {isStreaming && (
              <div className="w-full max-w-[210mm] mb-4 no-print overflow-hidden rounded-full">
                <div className="shimmer-bar" />
              </div>
            )}
            
            <SermonPaper 
              content={displayedContent}
              title={formTitle}
              profile={profile}
              view={view as Section}
              isStreaming={isStreaming}
              isManualEdit={isManualEdit}
              date={currentSermonDate}
              onTitleChange={(newTitle) => setFormTitle(newTitle)}
              onContentChange={(newText) => {
                // If editing and separator is missing, re-append original sources
                const currentSources = editableContent.split('----المصادر والمراجع----')[1] || '';
                if (!newText.includes('----المصادر والمراجع----') && currentSources) {
                  setEditableContent(newText + '\n\n----المصادر والمراجع----\n' + currentSources);
                } else {
                  setEditableContent(newText);
                }
              }}
            />

            {/* Smart Refine */}
            <div className="w-full max-w-[210mm] bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-lg mt-8 mb-32 border border-slate-100 dark:border-slate-700 no-print">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                    <RefreshCw size={16} className={isRefining ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[10px] dark:text-white uppercase tracking-widest">تحديث المحتوى</h4>
                    <p className="text-[9px] text-slate-400 font-bold">بسط الأسلوب، أضف دعاءً، أو أي تعديل آخر</p>
                  </div>
               </div>
               <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                  <input 
                    type="text"
                    placeholder="اكتب تعليماتك هنا..." 
                    className="flex-1 bg-transparent px-4 py-2 outline-none text-xs font-bold dark:text-white"
                    value={editInstruction}
                    onChange={e => setEditInstruction(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && editInstruction && !isRefining) {
                        // Trigger refining
                      }
                    }}
                  />
                  <button 
                    disabled={isRefining || !editInstruction}
                    onClick={async () => {
                      setIsRefining(true);
                      try {
                        // Safety check for update instruction
                        const safety = await analyzeInput('', editInstruction);
                        if (safety.status === 'REJECT' || safety.status === 'VIOLATION' || safety.status === 'CLARIFY') {
                          addNotification(safety.message || 'يرجى كتابة تعليمات واضحة ومناسبة', 'warning');
                          setIsRefining(false);
                          return;
                        }

                        const res = await refineContent(editableContent, editInstruction);
                        if (res) {
                          setEditableContent(res);
                          setEditInstruction('');
                          addNotification('تم التحديث بدقة', 'success');
                        }
                      } catch (err) {
                        addNotification('خطأ في التحديث', 'error');
                      }
                      setIsRefining(false);
                    }}
                    className="bg-emerald-600 text-white px-5 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    تحديث
                  </button>
               </div>
            </div>
          </div>

          <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-[400] flex gap-4 no-print shadow-2xl">
             <button onClick={() => navigator.clipboard.writeText(`${formTitle}\n\n${editableContent}`).then(() => addNotification('تم النسخ', 'success'))} className="flex-1 bg-slate-50 dark:bg-slate-800 py-4 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 dark:text-white"><Copy size={18}/> نسخ</button>
             <button onClick={() => navigator.share && navigator.share({ title: formTitle, text: editableContent })} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-700 transition-all"><Share2 size={18}/> مشاركة</button>
          </footer>
        </div>
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold dark:text-white">إعدادات الواعظ</h3>
                <button onClick={() => setShowSettings(false)} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-full text-slate-400"><Plus size={22} className="rotate-45" /></button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] text-center">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase mb-2">معرفك الرقمي الموثق</div>
                  <div className="text-2xl font-black text-emerald-900 dark:text-emerald-400 tracking-widest">{toArabicDigits(profile?.idNumber || '00000')}</div>
                </div>

                <div className="space-y-2 px-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mr-4">اسم الواعظ</label>
                  <input 
                    type="text"
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-emerald-500 outline-none text-xs font-bold dark:text-white"
                    value={profile?.displayName}
                    onChange={e => updateProfile({ displayName: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem]">
                  <div className="flex items-center gap-3">
                    <LogOut size={20} className="text-rose-500" />
                    <span className="text-xs font-bold dark:text-white">الوضع الليلي</span>
                  </div>
                  <button 
                   onClick={() => updateProfile({ settings: { ...profile!.settings, isDarkMode: !profile!.settings.isDarkMode } })}
                   className={`w-12 h-6 rounded-full relative transition-all ${profile?.settings.isDarkMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile?.settings.isDarkMode ? 'right-7' : 'left-1'}`}></div>
                  </button>
                </div>

                <button 
                  onClick={() => { auth.signOut(); setShowSettings(false); }}
                  className="w-full py-5 text-rose-500 font-bold text-xs border border-rose-50 dark:border-rose-900 rounded-2xl flex items-center justify-center gap-3 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={18} /> تسجيل الخروج
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default App;
