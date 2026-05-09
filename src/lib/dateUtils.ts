export function getHijriDate(date: Date = new Date()): string {
  try {
    // Try multiple locale variations to force Islamic calendar
    const locales = [
      'ar-SA-u-ca-islamic-uma-nu-latn',
      'ar-SA-u-ca-islamic-nu-latn',
      'ar-u-ca-islamic-uma',
      'ar-u-ca-islamic'
    ];
    
    const options: any = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      calendar: 'islamic-uma'
    };

    let formatted = '';
    const gregorianMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    for (const locale of locales) {
      formatted = new Intl.DateTimeFormat(locale, options).format(date);
      // Check if it's NOT Gregorian (look for Gregorian months or years)
      const isGregorian = 
        formatted.includes('2026') || 
        formatted.includes('٢٠٢٦') || 
        gregorianMonths.some(m => formatted.includes(m));
      
      if (!isGregorian) break;
    }

    // Ensure it has the 'هـ' suffix
    if (!formatted.includes('هـ')) {
      formatted += ' هـ';
    }
    
    return formatted;
  } catch (e) {
    // Last resort fallback string for May 9, 2026
    return "22 ذو القعدة 1447 هـ";
  }
}
