// Minimal {placeholder} substitution, matching the manual-replacement style
// already used for dict strings like onboarding.stepOf ("Step {current} of
// {total}") — no i18n/formatjs dependency needed for this app's scale.
export function formatTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}
