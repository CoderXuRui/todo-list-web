import { useState } from 'react';
import { quotes } from '../utils/quotes';

function getTodayKey() {
  const today = new Date();
  return `quote-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

export function QuoteBox() {
  const [quote] = useState(() => {
    const key = getTodayKey();
    const storedIndex = parseInt(sessionStorage.getItem(key) || '0', 10);
    // 挂载时设置下一句，但只在刷新页面时才变
    const nextIndex = (storedIndex + 1) % quotes.length;
    sessionStorage.setItem(key, String(nextIndex));
    return quotes[storedIndex % quotes.length];
  });

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 w-48 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-lavender/20 dark:border-lavender/30 animate-fade-in z-10">
      <div className="text-center">
        <span className="text-xl mb-2 block">💭</span>
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
          {quote.text}
        </p>
      </div>
    </div>
  );
}
