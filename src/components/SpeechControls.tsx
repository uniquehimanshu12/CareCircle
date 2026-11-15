import { Pause, Play, Square, Volume2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useSpeechSynthesis } from '../utils/speech';

interface SpeechControlsProps {
  text: string;
  controlKey: string;
  label?: string;
  compact?: boolean;
}

export function SpeechControls({
  text,
  controlKey,
  label,
  compact = false,
}: SpeechControlsProps) {
  const { lang, t } = useLanguage();
  const speech = useSpeechSynthesis(lang);

  if (!text.trim()) return null;

  if (!speech.supported) {
    return (
      <span className="text-xs text-[#5B728A]" role="note">
        {t.speech.unsupported}
      </span>
    );
  }

  const isThisActive = speech.activeKey === controlKey && speech.state !== 'idle';
  const isSpeaking = isThisActive && speech.state === 'speaking';
  const isPaused = isThisActive && speech.state === 'paused';

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {!isThisActive ? (
        <button
          type="button"
          onClick={() => speech.play(text, controlKey)}
          aria-label={label || t.speech.listen}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-[#CBE5DB] bg-[#EBF5F1] hover:bg-[#DCEEE6] text-[#1E6F5C] font-semibold transition-colors cursor-pointer ${
            compact ? 'min-h-[38px] px-3 py-1.5 text-xs' : 'min-h-[42px] px-3.5 py-2 text-sm'
          }`}
        >
          <Volume2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{label || t.speech.listen}</span>
        </button>
      ) : (
        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-[#CBE5DB] bg-[#EBF5F1] px-2.5 py-1">
          <span className="text-xs font-semibold text-[#1E6F5C] mr-1">
            {isPaused ? t.speech.paused : t.speech.speaking}
          </span>
          {isSpeaking ? (
            <button
              type="button"
              onClick={speech.pause}
              className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#CBE5DB] text-xs font-semibold text-[#10233D] cursor-pointer"
            >
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.speech.pause}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={speech.resume}
              className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1E6F5C] text-xs font-semibold text-white cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.speech.resume}</span>
            </button>
          )}
          <button
            type="button"
            onClick={speech.stop}
            className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#FECDCA] text-xs font-semibold text-[#B42318] cursor-pointer"
          >
            <Square className="h-3 w-3" aria-hidden="true" />
            <span>{t.speech.stop}</span>
          </button>
        </div>
      )}

      {isThisActive && lang === 'hi' && !speech.hasMatchingVoice && (
        <span className="text-xs text-[#5B728A]">{t.speech.noHindiVoiceNote}</span>
      )}
    </div>
  );
}
