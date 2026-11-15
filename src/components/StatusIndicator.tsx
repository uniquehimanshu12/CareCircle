import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import type { ComputedDoseState } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { formatDoseStateLabel } from '../i18n/locales';

interface StatusIndicatorProps {
  state: ComputedDoseState;
  compact?: boolean;
}

export function StatusIndicator({ state, compact = false }: StatusIndicatorProps) {
  const { lang } = useLanguage();

  const config: Record<
    ComputedDoseState,
    { colorClass: string; Icon: typeof CheckCircle2 }
  > = {
    taken: {
      colorClass: 'text-[#1E6F5C] bg-[#EBF5F1] border-[#CBE5DB]',
      Icon: CheckCircle2,
    },
    due_now: {
      colorClass: 'text-[#1E6F5C] bg-[#F2F8F5] border-[#B7DACA]',
      Icon: Clock,
    },
    upcoming: {
      colorClass: 'text-[#334E68] bg-[#F3EFE8] border-[#E4DFD5]',
      Icon: CalendarClock,
    },
    unconfirmed: {
      colorClass: 'text-[#B54708] bg-[#FDF2EA] border-[#F6D3BA]',
      Icon: AlertCircle,
    },
    missed: {
      colorClass: 'text-[#B42318] bg-[#FEF3F2] border-[#FECDCA]',
      Icon: XCircle,
    },
    skipped: {
      colorClass: 'text-[#5B728A] bg-[#F3EFE8] border-[#E4DFD5]',
      Icon: MinusCircle,
    },
  };

  const { colorClass, Icon } = config[state];
  const label = formatDoseStateLabel(state, lang);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap shrink-0 ${colorClass} ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
    >
      <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
