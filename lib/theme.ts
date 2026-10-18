export const themes = ["light", "dark", "system"] as const;

export type Theme = (typeof themes)[number];

export const themeStorageKey = "theme";

// Browser/OS chrome color (Android status bar, Safari tab bar, installed
// PWA title bar): matches the page background so it reads as part of the
// page in both themes, instead of a brand-colored strip. Keep in sync with
// --background in globals.css.
export const themeChromeColors = { light: "#ffffff", dark: "#0a0a0a" } as const;

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
    var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var color = dark ? '${themeChromeColors.dark}' : '${themeChromeColors.light}';
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', color);
  } catch (e) {}
})();
`;
