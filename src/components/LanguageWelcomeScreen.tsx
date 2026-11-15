import { HeartHandshake, Languages } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';

export function LanguageWelcomeScreen() {
  const { chooseInitialLanguage } = useLanguage();
  const en = TRANSLATIONS.en.welcome;
  const hi = TRANSLATIONS.hi.welcome;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#10233D] flex flex-col items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-xl rounded-2xl border border-[#E4DFD5] bg-white p-7 sm:p-10 shadow-sm space-y-8 text-center">
        <div className="space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[#EBF5F1] border border-[#CBE5DB] flex items-center justify-center">
            <HeartHandshake className="h-7 w-7 text-[#1E6F5C]" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-[#1E6F5C]">
            {en.tagline} · {hi.tagline}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#10233D] leading-snug">
            {en.heading}
            <span className="block text-xl sm:text-2xl font-semibold text-[#334E68] mt-1">
              {hi.heading}
            </span>
          </h1>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-base font-semibold text-[#10233D]">
            <Languages className="h-5 w-5 text-[#1E6F5C]" aria-hidden="true" />
            <span>{en.subheading} / {hi.subheading}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => chooseInitialLanguage('en')}
            className="min-h-[68px] px-6 py-4 rounded-xl border-2 border-[#1E6F5C] bg-[#1E6F5C] hover:bg-[#175849] text-white text-lg font-bold transition-colors cursor-pointer flex flex-col items-center justify-center gap-0.5"
          >
            <span>{en.englishButton}</span>
            <span className="text-xs font-medium text-[#EBF5F1]">Continue in English</span>
          </button>

          <button
            type="button"
            onClick={() => chooseInitialLanguage('hi')}
            className="min-h-[68px] px-6 py-4 rounded-xl border-2 border-[#1E6F5C] bg-white hover:bg-[#EBF5F1] text-[#10233D] text-lg font-bold transition-colors cursor-pointer flex flex-col items-center justify-center gap-0.5"
          >
            <span>{hi.hindiButton}</span>
            <span className="text-xs font-medium text-[#1E6F5C]">हिन्दी में आगे बढ़ें</span>
          </button>
        </div>

        <p className="text-sm text-[#5B728A] leading-relaxed">
          {en.helperNote}
          <span className="block mt-1">{hi.helperNote}</span>
        </p>
      </div>
    </div>
  );
}
