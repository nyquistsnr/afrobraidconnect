export const themes = ["light", "dark", "system"] as const;

export type Theme = (typeof themes)[number];

export const themeStorageKey = "theme";

export const isTheme = (value: string | null): value is Theme =>
  !!value && (themes as readonly string[]).includes(value);

/**
 * Inlined into the document head so the correct theme is applied before
 * hydration — avoids a flash of the wrong color scheme on load.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('${themeStorageKey}');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'system';
    if (theme !== 'system') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (e) {}
})();
`;
