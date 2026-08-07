import Link from "next/link";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { OnboardingStatusResponse } from "@/lib/api/types";
import {
  type ActiveStep,
  ONBOARDING_STEP_ORDER,
  STEP_DICT_KEYS,
  isStepCompleted,
  onboardingStepPath,
} from "@/lib/onboarding";

export function OnboardingStepper({
  dict,
  status,
  lang,
  viewedStep,
}: {
  dict: Dictionary["onboarding"];
  status: OnboardingStatusResponse;
  lang: Locale;
  viewedStep: ActiveStep | undefined;
}) {
  const total = ONBOARDING_STEP_ORDER.length;
  const stepper = dict.stepper as Record<string, string>;

  const viewedIndex = viewedStep ? ONBOARDING_STEP_ORDER.indexOf(viewedStep) : -1;
  const stepNumber = viewedIndex === -1 ? total : viewedIndex + 1;
  const stepLabel = viewedStep ? stepper[STEP_DICT_KEYS[viewedStep]] : undefined;

  // Where the backend would actually resume the wizard — distinct from
  // viewedStep whenever the visitor has navigated back to review or edit an
  // earlier, already-completed step.
  const resumeStep =
    status.current_step !== "COMPLETED"
      ? (status.current_step as ActiveStep)
      : undefined;
  const showResumeHint = resumeStep && viewedStep && resumeStep !== viewedStep;

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between gap-4 text-xs font-medium text-muted-foreground">
        <span>
          {dict.stepOf
            .replace("{current}", String(stepNumber))
            .replace("{total}", String(total))}
        </span>
        {stepLabel && <span className="text-foreground">{stepLabel}</span>}
      </div>

      <div className="flex items-center gap-1.5">
        {ONBOARDING_STEP_ORDER.map((step) => {
          const completed = isStepCompleted(status, step);
          const isViewed = step === viewedStep;
          const isResumePoint = step === resumeStep;

          return (
            <div
              key={step}
              title={stepper[STEP_DICT_KEYS[step]]}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                completed || isViewed
                  ? "bg-brand"
                  : isResumePoint
                    ? "bg-brand/40"
                    : "bg-border"
              }`}
            />
          );
        })}
      </div>

      {showResumeHint && (
        <Link
          href={onboardingStepPath(lang, resumeStep)}
          className="mt-2 inline-block text-xs font-medium text-brand hover:text-brand-hover"
        >
          {dict.resumeHint.replace(
            "{step}",
            stepper[STEP_DICT_KEYS[resumeStep]]
          )}
        </Link>
      )}
    </div>
  );
}
