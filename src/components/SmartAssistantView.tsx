import { useState, type FormEvent } from 'react';
import { MessageSquare, Send, ShieldCheck } from 'lucide-react';
import type {
  ActivityEvent,
  Appointment,
  CareCircle,
  DoseLog,
  Medication,
} from '../types';
import {
  buildScheduleForDate,
  computeWeeklyAdherence,
  getLocalDateKey,
  getLocalTimeHHmm,
} from '../utils/schedule';
import { askCareAssistant } from '../services/apiService';
import { useLanguage } from '../i18n/LanguageContext';
import { SpeechControls } from './SpeechControls';

interface SmartAssistantViewProps {
  circle: CareCircle;
  medications: Medication[];
  doseLogs: DoseLog[];
  appointments: Appointment[];
  activities: ActivityEvent[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export function SmartAssistantView({
  circle,
  medications,
  doseLogs,
  appointments,
  activities,
}: SmartAssistantViewProps) {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildLiveContext = () => {
    const now = new Date();
    const todayKey = getLocalDateKey(now, circle.timezone);
    const currentHHmm = getLocalTimeHHmm(now, circle.timezone);

    const todaySchedule = buildScheduleForDate({
      medications,
      doseLogs,
      dateKey: todayKey,
      timeZone: circle.timezone,
      now,
    }).map((slot) => ({
      medicationName: slot.medication.name,
      dosage: slot.medication.dosage,
      scheduledTime: slot.scheduledTime,
      instructions: slot.medication.instructions,
      status: slot.state,
      recordedBy: slot.log?.recordedByName || null,
      notes: slot.log?.notes || null,
    }));

    const weekly = computeWeeklyAdherence({
      medications,
      doseLogs,
      timeZone: circle.timezone,
      now,
    });

    const unconfirmedAcrossWeek: Array<{
      medicationName: string;
      dosage: string;
      date: string;
      scheduledTime: string;
    }> = [];
    for (const day of weekly.days) {
      const slots = buildScheduleForDate({
        medications,
        doseLogs,
        dateKey: day.dateKey,
        timeZone: circle.timezone,
        now,
      });
      for (const s of slots) {
        if (s.state === 'unconfirmed') {
          unconfirmedAcrossWeek.push({
            medicationName: s.medication.name,
            dosage: s.medication.dosage,
            date: s.dateKey,
            scheduledTime: s.scheduledTime,
          });
        }
      }
    }

    return {
      circleName: circle.name,
      elderName: circle.elderName,
      elderAge: circle.elderAge,
      timezone: circle.timezone,
      currentLocalDate: todayKey,
      currentLocalTime: currentHHmm,
      primaryConditionNotes: circle.primaryConditionNotes,
      medications: medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        scheduledTimes: m.scheduledTimes,
        instructions: m.instructions,
        startDate: m.startDate,
        endDate: m.endDate || 'ongoing',
        active: m.active,
      })),
      todaySchedule,
      unconfirmedDosesLast7Days: unconfirmedAcrossWeek,
      weeklyAdherenceSummary: {
        adherenceRatePct: weekly.adherenceRatePct,
        takenCount: weekly.takenCount,
        unconfirmedCount: weekly.unconfirmedCount,
        confirmedMissedCount: weekly.missedCount,
        skippedCount: weekly.skippedCount,
        dailyBreakdown: weekly.days.map((d) => ({
          date: d.dateKey,
          taken: d.taken,
          unconfirmed: d.unconfirmed,
          missed: d.missed,
          adherencePct: d.adherencePct,
        })),
      },
      appointments: appointments.map((a) => ({
        doctorName: a.doctorName,
        specialty: a.specialty,
        clinicName: a.clinicName,
        date: a.appointmentDate,
        time: a.appointmentTime,
        status: a.status,
        notes: a.notes,
      })),
      recentActivities: activities.slice(0, 15).map((act) => ({
        actor: act.actorName,
        category: act.category,
        summary: act.summary,
      })),
    };
  };

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    setError('');
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const { answer } = await askCareAssistant({
        question: trimmed,
        history: nextMessages.map((m) => ({ role: m.role, text: m.text })),
        circleContext: buildLiveContext(),
        responseLanguage: lang,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          role: 'model',
          text: answer,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.assistant.errReach);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#10233D]">{t.assistant.title}</h1>
        <p className="mt-1 text-base text-[#334E68]">
          {t.assistant.subtitle} ({circle.elderName})
        </p>
      </div>

      <div className="rounded-xl border border-[#CBE5DB] bg-[#EBF5F1] px-4 py-3 flex items-start gap-3 text-sm text-[#1E6F5C]">
        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
        <span>{t.assistant.safetyBanner}</span>
      </div>

      <div className="rounded-xl border border-[#E4DFD5] bg-white flex flex-col min-h-[460px]">
        {/* Quick Question Prompts */}
        <div className="p-4 border-b border-[#E4DFD5] bg-[#FAF8F5] rounded-t-xl flex flex-wrap gap-2">
          {t.assistant.quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => void sendQuestion(q)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#F3EFE8] text-sm font-medium text-[#10233D] transition-colors text-left cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Conversation Area */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[520px]">
          {messages.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <MessageSquare className="h-9 w-9 mx-auto text-[#5B728A]" aria-hidden="true" />
              <p className="text-base font-medium text-[#10233D]">{t.assistant.emptyTitle}</p>
              <p className="text-sm text-[#5B728A] max-w-md mx-auto">{t.assistant.emptyDesc}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}
              >
                <div
                  className={`max-w-2xl rounded-xl px-4 py-3 text-base leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#10233D] text-white'
                      : 'bg-[#FAF8F5] border border-[#E4DFD5] text-[#10233D]'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'model' && (
                  <SpeechControls
                    text={msg.text}
                    controlKey={`assistant_${msg.id}`}
                    label={t.assistant.listenAnswer}
                    compact
                  />
                )}
              </div>
            ))
          )}

          {loading && <div className="text-sm text-[#5B728A]">{t.assistant.reviewing}</div>}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
            >
              {error}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-[#E4DFD5] flex items-center gap-3"
        >
          <input
            type="text"
            aria-label={t.assistant.inputPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.assistant.inputPlaceholder}
            className="flex-1 min-h-[48px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-4 py-2.5 text-base text-[#10233D]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="min-h-[48px] inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-base font-semibold disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{t.assistant.askBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
