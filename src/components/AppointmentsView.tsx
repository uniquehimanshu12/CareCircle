import { useState, type FormEvent } from 'react';
import { Calendar, CheckCircle2, Edit3, MapPin, Plus, Stethoscope, Trash2 } from 'lucide-react';
import type {
  Appointment,
  AppointmentStatus,
  CareCircle,
  CircleRole,
} from '../types';
import {
  getAppointmentReminderWindow,
  getLocalDateKey,
} from '../utils/schedule';
import { deleteAppointment, saveAppointment } from '../services/careCircleService';
import { useLanguage } from '../i18n/LanguageContext';
import {
  formatAppointmentStatusLabel,
  formatDateFriendlyLocalized,
  formatNumberLocalized,
  formatTime12hLocalized,
} from '../i18n/locales';

interface AppointmentsViewProps {
  circle: CareCircle;
  currentRole: CircleRole;
  currentUserId: string;
  currentUserName: string;
  appointments: Appointment[];
}

export function AppointmentsView({
  circle,
  currentRole,
  currentUserId,
  currentUserName,
  appointments,
}: AppointmentsViewProps) {
  const { lang, t } = useLanguage();

  const canEdit =
    currentRole === 'primary_caregiver' ||
    currentRole === 'caretaker' ||
    currentRole === 'elder';
  const canDelete = currentRole === 'primary_caregiver' || currentRole === 'caretaker';
  const todayKey = getLocalDateKey(new Date(), circle.timezone);

  const [showForm, setShowForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(todayKey);
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('upcoming');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const resetForm = () => {
    setEditingAppt(null);
    setDoctorName('');
    setSpecialty('');
    setClinicName('');
    setAppointmentDate(todayKey);
    setAppointmentTime('10:00');
    setNotes('');
    setStatus('upcoming');
    setError('');
  };

  const openEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    setDoctorName(appt.doctorName);
    setSpecialty(appt.specialty);
    setClinicName(appt.clinicName);
    setAppointmentDate(appt.appointmentDate);
    setAppointmentTime(appt.appointmentTime);
    setNotes(appt.notes);
    setStatus(appt.status);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');

    if (doctorName.trim().length < 2 || clinicName.trim().length < 2) {
      setError(t.appointments.errDoctorClinicRequired);
      return;
    }

    setSaving(true);
    try {
      await saveAppointment({
        circleId: circle.id,
        editId: editingAppt?.id,
        doctorName,
        specialty,
        clinicName,
        appointmentDate,
        appointmentTime,
        notes,
        status,
        actorId: currentUserId,
        actorName: currentUserName,
        actorRole: currentRole,
      });
      setStatusMsg(editingAppt ? t.appointments.msgUpdated : t.appointments.msgScheduled);
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.appointments.errSave);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async (appt: Appointment) => {
    setError('');
    try {
      await saveAppointment({
        circleId: circle.id,
        editId: appt.id,
        doctorName: appt.doctorName,
        specialty: appt.specialty,
        clinicName: appt.clinicName,
        appointmentDate: appt.appointmentDate,
        appointmentTime: appt.appointmentTime,
        notes: appt.notes,
        status: 'completed',
        actorId: currentUserId,
        actorName: currentUserName,
        actorRole: currentRole,
      });
      setStatusMsg(`${t.appointments.msgCompleted} ${appt.doctorName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.appointments.errUpdate);
    }
  };

  const handleDelete = async (appt: Appointment) => {
    setError('');
    try {
      await deleteAppointment({
        circleId: circle.id,
        appt,
        actorId: currentUserId,
        actorName: currentUserName,
        actorRole: currentRole,
      });
      setStatusMsg(t.appointments.msgDeleted);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.appointments.errDelete);
    }
  };

  const upcoming = appointments
    .filter((a) => a.status === 'upcoming' && a.appointmentDate >= todayKey)
    .sort((a, b) =>
      `${a.appointmentDate} ${a.appointmentTime}`.localeCompare(
        `${b.appointmentDate} ${b.appointmentTime}`
      )
    );

  const history = appointments
    .filter((a) => a.status !== 'upcoming' || a.appointmentDate < todayKey)
    .sort((a, b) =>
      `${b.appointmentDate} ${b.appointmentTime}`.localeCompare(
        `${a.appointmentDate} ${a.appointmentTime}`
      )
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#10233D]">{t.appointments.title}</h1>
          <p className="mt-1 text-base text-[#334E68]">
            {t.appointments.subtitle} ({circle.elderName})
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t.appointments.addBtn}</span>
          </button>
        )}
      </div>

      {statusMsg && (
        <div className="rounded-lg border border-[#CBE5DB] bg-[#EBF5F1] px-4 py-3 text-sm font-medium text-[#1E6F5C]">
          {statusMsg}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
        >
          {error}
        </div>
      )}

      {showForm && canEdit && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#E4DFD5] pb-3">
            <h2 className="font-display text-lg font-bold text-[#10233D]">
              {editingAppt ? t.appointments.formEditTitle : t.appointments.formAddTitle}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="min-h-[42px] px-3 py-1.5 rounded-lg text-sm text-[#5B728A] hover:bg-[#FAF8F5] cursor-pointer"
            >
              {t.common.cancel}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label htmlFor="appt-doctor" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.appointments.doctorLabel}
              </label>
              <input
                id="appt-doctor"
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder={t.appointments.doctorPlaceholder}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D]"
              />
            </div>
            <div>
              <label htmlFor="appt-specialty" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.appointments.specialtyLabel}
              </label>
              <input
                id="appt-specialty"
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder={t.appointments.specialtyPlaceholder}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D]"
              />
            </div>
            <div>
              <label htmlFor="appt-clinic" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.appointments.clinicLabel}
              </label>
              <input
                id="appt-clinic"
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder={t.appointments.clinicPlaceholder}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label htmlFor="appt-date" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.appointments.dateLabel}
              </label>
              <input
                id="appt-date"
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base font-mono-code text-[#10233D]"
              />
            </div>
            <div>
              <label htmlFor="appt-time" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.appointments.timeLabel} ({circle.timezone}) *
              </label>
              <input
                id="appt-time"
                type="time"
                required
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base font-mono-code text-[#10233D]"
              />
            </div>
            {editingAppt && (
              <div>
                <label htmlFor="appt-status" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                  {t.appointments.statusLabel}
                </label>
                <select
                  id="appt-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                  className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D]"
                >
                  <option value="upcoming">{formatAppointmentStatusLabel('upcoming', lang)}</option>
                  <option value="completed">{formatAppointmentStatusLabel('completed', lang)}</option>
                  <option value="cancelled">{formatAppointmentStatusLabel('cancelled', lang)}</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="appt-notes" className="block text-sm font-semibold text-[#10233D] mb-1.5">
              {t.appointments.notesLabel}
            </label>
            <textarea
              id="appt-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.appointments.notesPlaceholder}
              className="w-full rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="min-h-[46px] px-6 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-base font-semibold disabled:opacity-60 cursor-pointer"
          >
            {saving
              ? t.common.saving
              : editingAppt
                ? t.appointments.saveChanges
                : t.appointments.saveAppointment}
          </button>
        </form>
      )}

      {/* Upcoming Appointments */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6">
        <h2 className="font-display text-lg font-bold text-[#10233D] border-b border-[#E4DFD5] pb-3">
          {t.appointments.upcomingTitle} ({formatNumberLocalized(upcoming.length, lang)})
        </h2>

        {upcoming.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Stethoscope className="h-9 w-9 mx-auto text-[#5B728A]" aria-hidden="true" />
            <p className="text-base text-[#334E68]">{t.appointments.emptyUpcoming}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4DFD5]">
            {upcoming.map((appt) => {
              const win = getAppointmentReminderWindow(appt, circle.timezone);
              return (
                <div
                  key={appt.id}
                  className="py-5 flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-[#10233D]">{appt.doctorName}</h3>
                      {appt.specialty && (
                        <span className="text-sm text-[#5B728A]">{appt.specialty}</span>
                      )}
                      {win === 'today' && (
                        <span className="text-sm font-semibold text-[#B54708]">
                          {t.appointments.reminderToday}
                        </span>
                      )}
                      {win === 'tomorrow' && (
                        <span className="text-sm font-semibold text-[#B54708]">
                          {t.appointments.reminderTomorrow}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#334E68]">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#5B728A]" aria-hidden="true" />
                        <span>{appt.clinicName}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-mono-code tabular-nums">
                        <Calendar className="h-4 w-4 text-[#5B728A]" aria-hidden="true" />
                        <span>
                          {formatDateFriendlyLocalized(appt.appointmentDate, lang)} ·{' '}
                          {formatTime12hLocalized(appt.appointmentTime, lang)}
                        </span>
                      </span>
                    </div>

                    {appt.notes && (
                      <p className="text-sm text-[#334E68] pt-1 max-w-2xl">{appt.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleMarkCompleted(appt)}
                          className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EBF5F1] text-[#1E6F5C] text-sm font-semibold hover:bg-[#DCEEE6] cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          <span>{t.appointments.completeBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(appt)}
                          className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E4DFD5] text-sm font-medium text-[#10233D] hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" aria-hidden="true" />
                          <span>{t.common.edit}</span>
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(appt)}
                        className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E4DFD5] text-sm font-medium text-[#B42318] hover:bg-[#FEF3F2] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>{t.common.delete}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Appointment History */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6">
        <h2 className="font-display text-lg font-bold text-[#10233D] border-b border-[#E4DFD5] pb-3">
          {t.appointments.historyTitle} ({formatNumberLocalized(history.length, lang)})
        </h2>

        {history.length === 0 ? (
          <p className="py-6 text-sm text-[#5B728A]">{t.appointments.emptyHistory}</p>
        ) : (
          <div className="divide-y divide-[#E4DFD5]">
            {history.map((appt) => (
              <div
                key={appt.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-[#10233D]">
                    {appt.doctorName} · {appt.clinicName}
                  </div>
                  <div className="text-sm text-[#5B728A] font-mono-code tabular-nums">
                    {formatDateFriendlyLocalized(appt.appointmentDate, lang)} ·{' '}
                    {formatTime12hLocalized(appt.appointmentTime, lang)} ·{' '}
                    <span>{formatAppointmentStatusLabel(appt.status, lang)}</span>
                  </div>
                  {appt.notes && <p className="text-sm text-[#334E68]">{appt.notes}</p>}
                </div>

                {canEdit && appt.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => openEdit(appt)}
                    className="min-h-[42px] px-3.5 py-2 rounded-lg border border-[#E4DFD5] text-sm font-medium text-[#334E68] hover:bg-[#FAF8F5] shrink-0 cursor-pointer"
                  >
                    {t.appointments.updateNotesBtn}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
