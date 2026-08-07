"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Clock, CalendarX2, Settings2 } from "lucide-react";
import { toast } from "react-toastify";

import { onboardingApi } from "@/lib/api/onboarding-client";
import type {
  AvailabilitySettingsResponse,
  WeeklyWindowResponse,
  AvailabilityExceptionResponse,
  DayOfWeek,
  AvailabilityExceptionType,
} from "@/lib/api/types";
import { Locale } from "@/lib/i18n";

import { Input } from "@/components/ui/input";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface AvailabilityFormProps {
  dict: any;
  common: any;
  lang: Locale;
  initialSettings: AvailabilitySettingsResponse;
  initialWindows: WeeklyWindowResponse[];
  initialExceptions: AvailabilityExceptionResponse[];
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export function AvailabilityForm({
  dict,
  common,
  lang,
  initialSettings,
  initialWindows,
  initialExceptions,
}: AvailabilityFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken as string;
  const queryClient = useQueryClient();

  // Settings State
  const [settings, setSettings] = useState(initialSettings);
  const [lastSavedSettings, setLastSavedSettings] = useState(initialSettings);
  
  const timezones = ["UTC", ...Intl.supportedValuesOf("timeZone")];

  // Local state for lists (could use react-query cache, but local state is easier to mutate optimistically)
  const [windows, setWindows] = useState(() => {
    if (initialWindows.length > 0) return initialWindows;
    // Prefill Mon-Sat if completely empty
    return DAYS_OF_WEEK.filter(d => d !== "SUNDAY").map(d => ({
      id: `temp-${d}`,
      day_of_week: d,
      start_time: "09:00",
      end_time: "17:00",
      is_active: true,
    })) as WeeklyWindowResponse[];
  });
  const [exceptions, setExceptions] = useState(initialExceptions);

  // New Window Form State
  const [newWindowDay, setNewWindowDay] = useState<DayOfWeek>("MONDAY");
  const [newWindowStart, setNewWindowStart] = useState("09:00");
  const [newWindowEnd, setNewWindowEnd] = useState("17:00");

  // New Exception Form State
  const [newExceptionDate, setNewExceptionDate] = useState("");
  const [newExceptionType, setNewExceptionType] = useState<AvailabilityExceptionType>("CLOSED");
  const [newExceptionStart, setNewExceptionStart] = useState("09:00");
  const [newExceptionEnd, setNewExceptionEnd] = useState("17:00");
  const [newExceptionReason, setNewExceptionReason] = useState("");

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      return onboardingApi.updateAvailabilitySettings(token, data);
    },
    onSuccess: (data) => {
      setSettings(data);
      setLastSavedSettings(data);
      toast.success(dict.toasts.settingsSaved);
    },
    onError: (err: any) => toast.error(err.message || common.errors.validationError),
  });

  function handleSettingsBlur() {
    if (
      settings.timezone !== lastSavedSettings.timezone ||
      settings.min_notice_hours !== lastSavedSettings.min_notice_hours ||
      settings.max_advance_days !== lastSavedSettings.max_advance_days ||
      settings.buffer_minutes !== lastSavedSettings.buffer_minutes
    ) {
      updateSettingsMutation.mutate(settings);
    }
  }

  const addWindowMutation = useMutation({
    mutationFn: async () => {
      return onboardingApi.createWeeklyWindow(token, {
        day_of_week: newWindowDay,
        start_time: newWindowStart,
        end_time: newWindowEnd,
      });
    },
    onSuccess: (data) => {
      setWindows((prev) => [...prev, data]);
      toast.success(dict.toasts.windowAdded);
    },
    onError: (err: any) => toast.error(err.message || common.errors.validationError),
  });

  const deleteWindowMutation = useMutation({
    mutationFn: async (id: string) => {
      return onboardingApi.deleteWeeklyWindow(token, id);
    },
    onSuccess: (_, id) => {
      setWindows((prev) => prev.filter((w) => w.id !== id));
      toast.success(dict.toasts.windowRemoved);
    },
    onError: (err: any) => toast.error(err.message || common.errors.validationError),
  });

  const addExceptionMutation = useMutation({
    mutationFn: async () => {
      return onboardingApi.createException(token, {
        date: newExceptionDate,
        exception_type: newExceptionType,
        start_time: newExceptionType === "CUSTOM_HOURS" ? newExceptionStart : undefined,
        end_time: newExceptionType === "CUSTOM_HOURS" ? newExceptionEnd : undefined,
        reason: newExceptionReason || undefined,
      });
    },
    onSuccess: (data) => {
      setExceptions((prev) => [...prev, data]);
      setNewExceptionDate("");
      setNewExceptionReason("");
      toast.success(dict.toasts.exceptionAdded);
    },
    onError: (err: any) => toast.error(err.message || common.errors.validationError),
  });

  const deleteExceptionMutation = useMutation({
    mutationFn: async (id: string) => {
      return onboardingApi.deleteException(token, id);
    },
    onSuccess: (_, id) => {
      setExceptions((prev) => prev.filter((e) => e.id !== id));
      toast.success(dict.toasts.exceptionRemoved);
    },
    onError: (err: any) => toast.error(err.message || common.errors.validationError),
  });

  async function handleContinue() {
    const tempWindows = windows.filter(w => w.id.startsWith("temp-"));
    if (tempWindows.length > 0) {
      try {
        await Promise.all(
          tempWindows.map(w =>
            onboardingApi.createWeeklyWindow(token, {
              day_of_week: w.day_of_week,
              start_time: w.start_time,
              end_time: w.end_time,
            })
          )
        );
      } catch (err: any) {
        toast.error(err.message || common.errors.validationError);
        return; // Halt navigation if saving fails
      }
    }
    router.push(`/${lang}/onboarding`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {dict.title}
        </h1>
        <p className="text-muted-foreground">{dict.subtitle}</p>
      </div>

      {/* Settings Section */}
      <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Settings2 className="size-5 text-brand" />
          <h2 className="text-xl font-medium">{dict.settingsTitle}</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <ComboboxInput
            label={dict.timezoneLabel}
            showLabel
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            onBlur={handleSettingsBlur}
            options={timezones}
          />
          <Input
            label={dict.minNoticeHoursLabel}
            showLabel
            type="number"
            min="0"
            value={settings.min_notice_hours}
            onChange={(e) => setSettings({ ...settings, min_notice_hours: Number(e.target.value) })}
            onBlur={handleSettingsBlur}
          />
          <Input
            label={dict.maxAdvanceDaysLabel}
            showLabel
            type="number"
            min="1"
            value={settings.max_advance_days}
            onChange={(e) => setSettings({ ...settings, max_advance_days: Number(e.target.value) })}
            onBlur={handleSettingsBlur}
          />
          <Input
            label={dict.bufferMinutesLabel}
            showLabel
            type="number"
            min="0"
            value={settings.buffer_minutes}
            onChange={(e) => setSettings({ ...settings, buffer_minutes: Number(e.target.value) })}
            onBlur={handleSettingsBlur}
          />
        </div>
      </section>

      {/* Weekly Windows Section */}
      <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Clock className="size-5 text-brand" />
          <h2 className="text-xl font-medium">{dict.weeklyWindowsTitle}</h2>
        </div>

        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayWindows = windows.filter((w) => w.day_of_week === day);
            const hasWindows = dayWindows.length > 0;
            return (
              <div key={day} className="flex flex-col gap-3 border-b border-border/50 py-4 last:border-0 md:flex-row md:items-center md:py-3">
                <div className="flex w-32 items-center gap-2 font-medium text-foreground">
                  <div className={`size-1.5 rounded-full ${hasWindows ? "bg-brand" : "bg-border"}`} />
                  <span className={hasWindows ? "" : "text-muted-foreground"}>{dict.days[day]}</span>
                </div>
                <div className="flex flex-1 flex-wrap gap-2">
                  {hasWindows ? (
                    dayWindows.map((w) => (
                      <div
                        key={w.id}
                        className="group flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 pl-4 pr-1.5 py-1 text-sm font-medium text-brand transition-colors hover:border-brand/30 hover:bg-brand/10"
                      >
                        <Clock className="size-3.5 opacity-70" />
                        <span className="mr-1">
                          {w.start_time.slice(0, 5)} - {w.end_time.slice(0, 5)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (w.id.startsWith("temp-")) {
                              setWindows((prev) => prev.filter((win) => win.id !== w.id));
                            } else {
                              deleteWindowMutation.mutate(w.id);
                            }
                          }}
                          className="flex size-6 items-center justify-center rounded-full text-brand/60 transition-colors hover:bg-red-500/10 hover:text-red-600 focus:outline-none"
                          disabled={deleteWindowMutation.isPending}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground/60">{dict.exceptionTypes.CLOSED}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4 rounded-xl border border-border border-dashed p-5 bg-muted/30">
          <Select
            label="Day"
            showLabel
            options={DAYS_OF_WEEK.map(d => ({ value: d, label: dict.days[d] }))}
            value={newWindowDay}
            onChange={setNewWindowDay}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={dict.startTimeLabel}
              showLabel
              type="time"
              value={newWindowStart}
              onChange={(e) => setNewWindowStart(e.target.value)}
            />
            <Input
              label={dict.endTimeLabel}
              showLabel
              type="time"
              value={newWindowEnd}
              onChange={(e) => setNewWindowEnd(e.target.value)}
            />
          </div>
          <Button
            onClick={() => addWindowMutation.mutate()}
            disabled={addWindowMutation.isPending}
            className="w-full mt-2"
          >
            <Plus className="mr-2 size-4" />
            {dict.addWindow}
          </Button>
        </div>
      </section>

      {/* Exceptions Section */}
      <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <CalendarX2 className="size-5 text-brand" />
          <h2 className="text-xl font-medium">{dict.exceptionsTitle}</h2>
        </div>

        <div className="space-y-3">
          {exceptions.map((exc) => (
            <div key={exc.id} className="flex items-center justify-between rounded-lg border border-border bg-muted p-4">
              <div>
                <div className="font-medium">{exc.date}</div>
                <div className="text-sm text-muted-foreground">
                  {exc.exception_type === "CLOSED" ? dict.exceptionTypes.CLOSED : `${dict.exceptionTypes.CUSTOM_HOURS} (${exc.start_time?.slice(0, 5)} - ${exc.end_time?.slice(0, 5)})`}
                  {exc.reason && ` • ${exc.reason}`}
                </div>
              </div>
              <button
                onClick={() => deleteExceptionMutation.mutate(exc.id)}
                className="rounded-md p-2 text-icon-muted hover:bg-border hover:text-red-500"
                disabled={deleteExceptionMutation.isPending}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border border-dashed p-5 bg-muted/30">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={dict.dateLabel}
              showLabel
              type="date"
              value={newExceptionDate}
              onChange={(e) => setNewExceptionDate(e.target.value)}
            />
            <Select
              label={dict.exceptionTypeLabel}
              showLabel
              options={[
                { value: "CLOSED", label: dict.exceptionTypes.CLOSED },
                { value: "CUSTOM_HOURS", label: dict.exceptionTypes.CUSTOM_HOURS },
              ]}
              value={newExceptionType}
              onChange={(val) => setNewExceptionType(val as AvailabilityExceptionType)}
            />
          </div>

          {newExceptionType === "CUSTOM_HOURS" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={dict.startTimeLabel}
                showLabel
                type="time"
                value={newExceptionStart}
                onChange={(e) => setNewExceptionStart(e.target.value)}
              />
              <Input
                label={dict.endTimeLabel}
                showLabel
                type="time"
                value={newExceptionEnd}
                onChange={(e) => setNewExceptionEnd(e.target.value)}
              />
            </div>
          )}

          <Input
            label={dict.reasonLabel}
            showLabel
            placeholder="e.g. Holiday"
            value={newExceptionReason}
            onChange={(e) => setNewExceptionReason(e.target.value)}
          />
          <Button
            onClick={() => addExceptionMutation.mutate()}
            disabled={addExceptionMutation.isPending || !newExceptionDate}
            variant="outline"
            className="w-full mt-2"
          >
            <Plus className="mr-2 size-4" />
            {dict.addException}
          </Button>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <Button onClick={handleContinue} className="w-full md:w-auto md:px-8">
          {dict.continue}
        </Button>
      </div>
    </div>
  );
}
