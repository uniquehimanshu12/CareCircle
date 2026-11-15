import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] p-1 ${
        compact ? 'gap-1' : 'w-full gap-1'
      }`}
      role="group"
      aria-label={t.nav.languageSwitcherAria}
    >
      {!compact && (
        <Languages className="h-4 w-4 text-[#5B728A] ml-2 mr-1 shrink-0" aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`min-h-[38px] flex-1 px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
          lang === 'en'
            ? 'bg-[#1E6F5C] text-white shadow-sm'
            : 'text-[#334E68] hover:text-[#10233D] hover:bg-white'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLang('hi')}
        aria-pressed={lang === 'hi'}
        className={`min-h-[38px] flex-1 px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
          lang === 'hi'
            ? 'bg-[#1E6F5C] text-white shadow-sm'
            : 'text-[#334E68] hover:text-[#10233D] hover:bg-white'
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}
