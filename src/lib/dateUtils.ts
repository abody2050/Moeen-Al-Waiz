export function getHijriDate(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-uma-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  // Format returns something like "٢٣ ذو القعدة، ١٤٤٧ هـ" or "23 Thu al-Qi'dah 1447 AH"
  // depending on system environment, but Intl ar-SA usually works well.
  let formatted = formatter.format(date);
  
  // Ensure it has the 'هـ' suffix if not present
  if (!formatted.includes('هـ')) {
    formatted += ' هـ';
  }
  
  return formatted;
}
