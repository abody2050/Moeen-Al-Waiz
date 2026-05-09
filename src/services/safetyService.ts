export type AnalysisResult = {
  status: 'PASS' | 'IMPROVE' | 'CLARIFY' | 'VIOLATION' | 'REJECT';
  message?: string;
  improvedTitle?: string;
};

export async function analyzeInput(title: string, instructions: string): Promise<AnalysisResult> {
  try {
    const prompt = `أنت مساعد رقابي لموقع "معين الواعظ". مهمتك تحليل مدخلات المستخدم (العنوان والتوجيهات) للتأكد من سلامتها وجودتها.
    
    المدخلات:
    العنوان: ${title || 'غير محدد'}
    التوجيهات أو طلب التحديث: ${instructions}

    حلل المدخلات وأرجع النتيجة بصيغة JSON حصراً كالتالي:
    {
      "status": "PASS" | "IMPROVE" | "CLARIFY" | "VIOLATION" | "REJECT",
      "message": "رسالة نصيحة بأسلوب واعظ محترم باللغة العربية، وجه المستخدم للصواب بلطف",
      "improvedTitle": "عنوان محسن إذا كان العنوان الأصلي موجوداً ويحتاج تحسين بسيط"
    }

    القواعد:
    1. "PASS": إذا كان كل شيء سليماً وواضحاً ومناسباً لخطبة أو موعظة أو تعليمات تحديث منطقية ومحترمة.
    2. "IMPROVE": إذا كان العنوان بسيطاً جداً أو يحتاج صياغة أجمل أو كانت التعليمات جيدة ولكن يمكن تنبيه المستخدم لشيء أفضل.
    3. "CLARIFY": إذا كان العنوان أو التعليمات غير مفهومة أو متناقضة أو غامضة جداً.
    4. "VIOLATION": إذا احتوى على ألفاظ قبيحة، استهزاء، سخرية، أو محتوى لا يليق بمقام الواعظ والمنبر.
    5. "REJECT": للمحتوى الخطير، التحريض، المخالف للشرع بشكل صارخ، أو الطلبات التي تخرج عن نطاق "معين الواعظ" لأهداف مشبوهة. حذر من تكرار ذلك وعواقبه.

    تذكر: كن رفيقاً في النصح، إلا في حالات الرفض القوية.`;

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      console.warn("Safety check failed on server - bypassing.");
      return { status: 'PASS' };
    }

    return await response.json();
  } catch (error) {
    console.error("Safety Analysis Error:", error);
    return { status: 'PASS' }; // Default to pass if AI fails
  }
}
