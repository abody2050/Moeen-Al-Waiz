import { GoogleGenAI } from "@google/genai";
import { Section, SectionConfig } from "../types";

let aiInstance: any = null;

function getAI() {
  if (!aiInstance) {
    // Use Vite's environment variable access
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("يرجى إعداد مفتاح VITE_GEMINI_API_KEY في إعدادات Vercel للبدء.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const SECTION_CONFIG: Record<string, SectionConfig> = {
  sermon: { title: 'الخطبة المنبرية', text: 'text-emerald-600', label: 'خطبة', icon: null },
  exhortation: { title: 'الموعظة المؤثرة', text: 'text-indigo-600', label: 'موعظة', icon: null },
  lesson: { title: 'الدرس العلمي', text: 'text-blue-600', label: 'درس', icon: null },
  reflection: { title: 'الخاطرة الدعوية', text: 'text-amber-500', label: 'خاطرة', icon: null },
  story: { title: 'قصة وعبرة', text: 'text-rose-600', label: 'قصة', icon: null },
};

export async function* generateSermonStream(
  view: Section, 
  title: string, 
  duration: number, 
  instructions: string
) {
  let specificConfig = '';
  if (view === 'sermon') {
    specificConfig = `نوع المحتوى: خطبة منبرية.
    الهيكل: مقدمة الحاجة كاملة، ثم الخطبة الأولى، ثم فاصل قصير، ثم الخطبة الثانية، ثم الخاتمة والأدعية.
    المتطلبات: تقسيم النص إلى (الخطبة الأولى) و (الخطبة الثانية).`;
  } else if (view === 'exhortation') {
    specificConfig = `نوع المحتوى: موعظة مؤثرة.
    الهيكل: مقدمة نبوية كاملة بليغة، ثم نص الموعظة ككتلة واحدة مسترسلة وطويلة جداً، دون تقسيمها لخطبتين.
    المتطلبات: يجب أن تكون الموعظة غنية بالرقائق والقصص المؤثرة.`;
  } else if (view === 'reflection') {
    specificConfig = `نوع المحتوى: خاطرة دعوية.
    الهيكل: مقدمة قصيرة جداً (بسم الله والصلاة والسلام على رسول الله وبعد)، ثم الدخول في الخاطرة مباشرة بأسلوب أدبي بليغ ومركز.
    المتطلبات: نص واحد مسترسل ومكثف.`;
  } else if (view === 'lesson') {
    specificConfig = `نوع المحتوى: درس علمي.
    الهيكل: مقدمة تعليمية (الحمد لله رب العالمين والصلوات على المرسلين، أما بعد فهذا درس في...)، ثم تقسيم الدرس إلى عناصر موضوعية واضحة.
    المتطلبات: أسلوب أكاديمي شرعي رصين.`;
  } else if (view === 'story') {
    specificConfig = `نوع المحتوى: قصة وعبرة.
    الهيكل: مقدمة سردية مشوقة، ثم أحداث القصة، ثم استخراج الفوائد والعبر في النهاية.
    المتطلبات: نص مشوق وبليغ.`;
  }

  const targetWords = duration * 100;
  const wordCountVariance = duration > 10 ? 100 : 20;

  const systemInstruction = `أنت باحث شرعي ومحرر لغوي بليغ جداً. 
    صغ المحتوى باللغة العربية الفصحى البليغة بأسلوب وعظي رصين ومؤثر.
    
    ${specificConfig}

    قواعد التنسيق الإلزامية:
    1. الكثافة النصية والعدد: المدة المطلوبة هي ${duration} دقيقة. يجب أن يكون عدد الكلمات حوالي ${targetWords} كلمة (بين ${targetWords} و ${targetWords + wordCountVariance} كلمة) لضمان دقة وقت الإلقاء. أسهب في الشرح والاستشهاد لملء الوقت المطلوب بدقة دون حشو لغوي غير مفيد.
    2. اقتراح العنوان: إذا كان موضوع المستخدم بسيطاً، اقترح له عنواناً بليغاً ومركزاً وجميلاً جداً. ابدأ ردك بـ: "SUGGESTED_TITLE: [العنوان الجديد]" في أول سطر.
    3. الآيات القرآنية: حصراً بين ﴿ ﴾ مشكولة بدقة.
    4. الأحاديث النبوية: حصراً بين القوسين الصغيرين « » (مثال: «إنما الأعمال بالنيات»).
    5. أقوال العلماء والحكم: حصراً بين علامات الاقتباس المزخرفة “ ” (مثال: “العلم ما نفع”).
    6. التوثيق: استخدم أرقام مراجع صغيرة جداً بين [ ] مثل [1] توضع مباشرة بعد النص المقتبس.
    7. المراجع والمصادر: اذكرها في النهاية بكل دقة وتفصيل تحت عنوان "----المصادر والمراجع----".
    8. عدم إدارج أي ملاحظات جانبية: يمنع منعاً باتاً كتابة أي تعليمات مسرحية أو ملاحظات مثل [فاصل قصير]، [توقف]، [نهاية الخطبة الأولى]، أو أي نص ليس جزءاً من الخطاب الفعلي.
    9. الخطبة الأولى والثانية: إذا كان الطلب 'خطبة جمعة' أو 'sermon' يتم تقسيم الكلام إلى جزئين، ابدأ بعبارة "### الخطبة الأولى" وانتقل للثانية بعبارة "### الخطبة الثانية" دون أي فواصل وصفية بينهما.
    10. تنسيق الفقرات: استخدم سطرين فارغين بين كل فقرة وأخرى لضمان الوضوح. ونوع في طول الجمل والفقرات.
    11. اللمسة النهائية: عند بلوغ النهاية، اكتب "---FINISH---" في سطر منفصل.`;

  const prompt = `الموضوع: ${title}. 
    النوع: ${SECTION_CONFIG[view]?.label || 'محتوى دعوي'}. 
    المدة المستهدفة للإلقاء: ${duration} دقيقة (المطلوب نص بطول ${targetWords} كلمة تقريباً). 
    ملاحظات إضافية: ${instructions}.`;

  const response = await getAI().models.generateContentStream({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config: { systemInstruction }
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

export async function refineContent(
  currentContent: string,
  instruction: string
) {
  const systemInstruction = `أنت تقوم بتحديث نص دعوي. عدل فقط ما يطلبه المستخدم مع الحفاظ التام على:
  1. الهيكل العام (المقدمة، الخطبة الأولى، الخطبة الثانية، الخاتمة).
  2. الآيات القرآنية كما هي ﴿ ﴾.
  3. التوثيق التفصيلي والمراجع.`;

  const prompt = `الطلب الجديد: "${instruction}"
  النص الحالي المراد تعديله: \n\n${currentContent}`;

  const result = await getAI().models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config: { systemInstruction }
  });

  return result.text;
}
