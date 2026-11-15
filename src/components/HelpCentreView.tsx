import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  HeartHandshake,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Pill,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { GUIDED_TOUR, MANUAL_SECTIONS, type ManualSectionId } from '../i18n/manualContent';
import { formatNumberLocalized } from '../i18n/locales';
import { SpeechControls } from './SpeechControls';

export type HelpNavTarget =
  | 'dashboard'
  | 'medications'
  | 'appointments'
  | 'scanner'
  | 'circle'
  | 'notifications';

interface HelpCentreViewProps {
  onNavigate: (tab: HelpNavTarget) => void;
}

const SECTION_ICONS: Record<ManualSectionId, typeof Users> = {
  A: Users,
  B: LayoutDashboard,
  C: Pill,
  D: Calendar,
  E: Bell,
  F: MessageSquare,
  G: HeartHandshake,
  H: ShieldCheck,
};

export function HelpCentreView({ onNavigate }: HelpCentreViewProps) {
  const { lang, t } = useLanguage();
  const tourSteps = GUIDED_TOUR[lang];
  const sections = MANUAL_SECTIONS[lang];

  const [tourIdx, setTourIdx] = useState(0);
  const [openIds, setOpenIds] = useState<ManualSectionId[]>(['A', 'B']);

  const currentStep = tourSteps[tourIdx] || tourSteps[0];

  const toggleSection = (id: ManualSectionId) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E6F5C] mb-1">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>{t.common.appName}</span>
          <span className="text-[#5B728A]">· {t.common.tagline}</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#10233D]">
          {t.help.title}
        </h1>
        <p className="mt-1.5 text-base text-[#334E68] max-w-3xl leading-relaxed">
          {t.help.subtitle}
        </p>
      </div>

      {/* Start Here Guided Tour */}
      <section
        aria-labelledby="guided-tour-heading"
        className="rounded-xl border-2 border-[#CBE5DB] bg-white p-6 sm:p-7 space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E4DFD5] pb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#EBF5F1] border border-[#CBE5DB] flex items-center justify-center shrink-0">
              <Compass className="h-5 w-5 text-[#1E6F5C]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="guided-tour-heading" className="font-display text-xl font-bold text-[#10233D]">
                {t.help.tourTitle}
              </h2>
              <p className="text-sm text-[#5B728A] mt-0.5">{t.help.tourSubtitle}</p>
            </div>
          </div>

          <div className="font-mono-code text-sm font-semibold text-[#1E6F5C] bg-[#EBF5F1] border border-[#CBE5DB] px-3 py-1.5 rounded-lg">
            {t.help.tourStepLabel} {formatNumberLocalized(currentStep.stepNumber, lang)} /{' '}
            {formatNumberLocalized(tourSteps.length, lang)}
          </div>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.help.tourTitle}>
          {tourSteps.map((step, idx) => (
            <button
              key={step.stepNumber}
              type="button"
              role="tab"
              aria-selected={idx === tourIdx}
              onClick={() => setTourIdx(idx)}
              className={`min-h-[42px] px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                idx === tourIdx
                  ? 'bg-[#1E6F5C] text-white'
                  : 'bg-[#FAF8F5] border border-[#E4DFD5] text-[#334E68] hover:bg-[#F3EFE8]'
              }`}
            >
              {formatNumberLocalized(step.stepNumber, lang)}. {step.title}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-[#E4DFD5] bg-[#FAF8F5] p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-[#10233D]">
              {formatNumberLocalized(currentStep.stepNumber, lang)}. {currentStep.title}
            </h3>
            <SpeechControls
              text={`${currentStep.title}. ${currentStep.description}`}
              controlKey={`tour_${currentStep.stepNumber}`}
              compact
            />
          </div>
          <p className="text-base text-[#334E68] leading-relaxed">{currentStep.description}</p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={tourIdx === 0}
                onClick={() => setTourIdx((i) => Math.max(0, i - 1))}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#F3EFE8] text-sm font-semibold text-[#10233D] disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>{t.help.tourPrev}</span>
              </button>
              <button
                type="button"
                disabled={tourIdx === tourSteps.length - 1}
                onClick={() => setTourIdx((i) => Math.min(tourSteps.length - 1, i + 1))}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#F3EFE8] text-sm font-semibold text-[#10233D] disabled:opacity-40 cursor-pointer"
              >
                <span>{t.help.tourNext}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate(currentStep.targetTab)}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>{t.help.tourGoToFeature}</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Expandable User Manual Sections A-H */}
      <section aria-labelledby="manual-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="manual-heading" className="font-display text-xl font-bold text-[#10233D]">
              {t.help.manualTitle}
            </h2>
            <p className="text-sm text-[#5B728A] mt-0.5">{t.help.manualSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenIds(sections.map((s) => s.id))}
              className="min-h-[42px] px-3.5 py-2 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#FAF8F5] text-sm font-semibold text-[#10233D] cursor-pointer"
            >
              {t.help.expandAll}
            </button>
            <button
              type="button"
              onClick={() => setOpenIds([])}
              className="min-h-[42px] px-3.5 py-2 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#FAF8F5] text-sm font-semibold text-[#334E68] cursor-pointer"
            >
              {t.help.collapseAll}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section) => {
            const isOpen = openIds.includes(section.id);
            const Icon = SECTION_ICONS[section.id];
            const speechBody = [
              section.title,
              section.explanation,
              ...section.steps,
              `${t.help.labelWhere}: ${section.whereToFind}`,
            ].join('. ');

            return (
              <div
                key={section.id}
                className="rounded-xl border border-[#E4DFD5] bg-white overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`manual-panel-${section.id}`}
                  onClick={() => toggleSection(section.id)}
                  className="w-full min-h-[60px] px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="h-9 w-9 rounded-lg bg-[#EBF5F1] border border-[#CBE5DB] flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-[#1E6F5C]" aria-hidden="true" />
                    </span>
                    <span className="font-display text-lg font-bold text-[#10233D]">
                      {section.title}
                    </span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-[#5B728A] shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#5B728A] shrink-0" aria-hidden="true" />
                  )}
                </button>

                {isOpen && (
                  <div
                    id={`manual-panel-${section.id}`}
                    className="px-5 pb-6 pt-2 border-t border-[#E4DFD5] space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-[#1E6F5C]">
                        {t.help.labelExplanation}
                      </h3>
                      <SpeechControls
                        text={speechBody}
                        controlKey={`manual_${section.id}`}
                        label={t.help.listenSection}
                        compact
                      />
                    </div>
                    <p className="text-base text-[#10233D] leading-relaxed">{section.explanation}</p>

                    <div className="space-y-2">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-[#1E6F5C]">
                        {t.help.labelSteps}
                      </h3>
                      <ol className="space-y-2.5 list-decimal pl-5 text-base text-[#334E68] leading-relaxed">
                        {section.steps.map((stepText, idx) => (
                          <li key={idx}>{stepText}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] p-4 space-y-1">
                      <h3 className="text-sm font-bold text-[#10233D]">{t.help.labelWhere}</h3>
                      <p className="text-sm sm:text-base text-[#334E68]">{section.whereToFind}</p>
                    </div>

                    <div className="rounded-lg border border-[#F6D3BA] bg-[#FDF2EA] p-4 space-y-2">
                      <h3 className="text-sm font-bold text-[#B54708]">{t.help.labelMistakes}</h3>
                      <ul className="space-y-1.5 list-disc pl-5 text-sm sm:text-base text-[#334E68]">
                        {section.commonMistakes.map((mistake, idx) => (
                          <li key={idx}>{mistake}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Help & Support Contact Card */}
      <section
        aria-labelledby="support-contact-heading"
        className="rounded-xl border-2 border-[#CBE5DB] bg-[#F7FAF9] p-6 sm:p-7 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-white border border-[#CBE5DB] flex items-center justify-center text-[#1E6F5C] shrink-0 shadow-xs">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold text-[#10233D]">{t.common.appName}</span>
                <span className="text-xs font-semibold text-[#1E6F5C] bg-[#EBF5F1] px-2 py-0.5 rounded-md">
                  {t.common.tagline}
                </span>
              </div>
              <h2 id="support-contact-heading" className="font-display text-lg font-bold text-[#10233D] mt-1">
                {t.help.supportHeading}
              </h2>
              <p className="text-sm text-[#334E68] mt-0.5 leading-relaxed max-w-xl">
                {t.help.supportDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0">
            <span className="text-xs font-semibold text-[#5B728A] uppercase tracking-wider">
              {t.help.supportEmailLabel}
            </span>
            <a
              href="mailto:unique.himanshu12@gmail.com"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold transition-colors shadow-xs"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>unique.himanshu12@gmail.com</span>
            </a>
            <span className="text-xs text-[#5B728A]">{t.help.supportResponseTime}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
