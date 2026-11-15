import type { DailyAdherencePoint } from '../utils/schedule';
import { useLanguage } from '../i18n/LanguageContext';
import {
  formatNumberLocalized,
  formatPercentLocalized,
  formatWeekdayShortLocalized,
} from '../i18n/locales';

interface AdherenceChartProps {
  days: DailyAdherencePoint[];
  adherenceRatePct: number | null;
  takenCount: number;
  unconfirmedCount: number;
  missedCount: number;
}

export function AdherenceChart({
  days,
  adherenceRatePct,
  takenCount,
  unconfirmedCount,
  missedCount,
}: AdherenceChartProps) {
  const { lang, t } = useLanguage();

  const maxBarTotal = Math.max(
    1,
    ...days.map((d) => d.taken + d.unconfirmed + d.missed + d.scheduled)
  );

  return (
    <div className="rounded-xl border border-[#E4DFD5] bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#E4DFD5] pb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#10233D]">{t.chart.title}</h3>
          <p className="mt-1 text-sm text-[#5B728A]">{t.chart.subtitle}</p>
        </div>
        <div className="text-right">
          <div className="font-mono-code text-3xl font-semibold text-[#10233D] tabular-nums">
            {adherenceRatePct !== null ? formatPercentLocalized(adherenceRatePct, lang) : '—'}
          </div>
          <div className="text-xs text-[#5B728A]">{t.chart.weeklyRate}</div>
        </div>
      </div>

      {/* Stacked Bar Visualization */}
      <div className="mt-6">
        <div className="grid grid-cols-7 gap-3 items-end h-44">
          {days.map((day) => {
            const total = day.taken + day.unconfirmed + day.missed + day.scheduled;
            const takenH = Math.round((day.taken / maxBarTotal) * 128);
            const unconfH = Math.round((day.unconfirmed / maxBarTotal) * 128);
            const missedH = Math.round((day.missed / maxBarTotal) * 128);
            const schedH = Math.round((day.scheduled / maxBarTotal) * 128);

            return (
              <div key={day.dateKey} className="flex flex-col items-center gap-2">
                <div className="font-mono-code text-xs text-[#5B728A] tabular-nums">
                  {day.adherencePct !== null
                    ? formatPercentLocalized(day.adherencePct, lang)
                    : total > 0
                      ? t.chart.dueLabel
                      : formatNumberLocalized(0, lang)}
                </div>
                <div
                  className="w-full max-w-[44px] h-32 rounded-lg bg-[#FAF8F5] border border-[#E4DFD5] flex flex-col justify-end overflow-hidden p-1 gap-0.5"
                  title={`${day.dateKey}: ${day.taken} ${t.chart.takenLegend}, ${day.unconfirmed} ${t.chart.unconfirmedLegend}, ${day.missed} ${t.chart.missedLegend}`}
                >
                  {total === 0 ? (
                    <div className="h-1 w-full rounded bg-[#E4DFD5]" />
                  ) : (
                    <>
                      {schedH > 0 && (
                        <div
                          style={{ height: `${Math.max(4, schedH)}px` }}
                          className="w-full rounded-sm bg-[#CBD5E1]"
                        />
                      )}
                      {missedH > 0 && (
                        <div
                          style={{ height: `${Math.max(4, missedH)}px` }}
                          className="w-full rounded-sm bg-[#B42318]"
                        />
                      )}
                      {unconfH > 0 && (
                        <div
                          style={{ height: `${Math.max(4, unconfH)}px` }}
                          className="w-full rounded-sm bg-[#D96B27]"
                        />
                      )}
                      {takenH > 0 && (
                        <div
                          style={{ height: `${Math.max(4, takenH)}px` }}
                          className="w-full rounded-sm bg-[#1E6F5C]"
                        />
                      )}
                    </>
                  )}
                </div>
                <div className="text-xs font-medium text-[#334E68] text-center">
                  {formatWeekdayShortLocalized(day.dateKey, lang)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explicit Legend with Tabular Counts */}
      <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-[#E4DFD5] pt-4 text-sm text-[#334E68]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#1E6F5C]" aria-hidden="true" />
          <span>
            {t.chart.takenLegend}:{' '}
            <strong className="font-mono-code tabular-nums">
              {formatNumberLocalized(takenCount, lang)}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#D96B27]" aria-hidden="true" />
          <span>
            {t.chart.unconfirmedLegend}:{' '}
            <strong className="font-mono-code tabular-nums">
              {formatNumberLocalized(unconfirmedCount, lang)}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#B42318]" aria-hidden="true" />
          <span>
            {t.chart.missedLegend}:{' '}
            <strong className="font-mono-code tabular-nums">
              {formatNumberLocalized(missedCount, lang)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
