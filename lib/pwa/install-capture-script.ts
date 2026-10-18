// Inlined in the root layout's <head> (no "use client": the server layout
// needs the plain string). Chrome/Edge/Samsung fire `beforeinstallprompt`
// once the PWA is installable — sometimes before React hydrates — so this
// captures it immediately and stashes it on window for lib/pwa/install.ts.
// preventDefault() suppresses Chrome's own mini-infobar so our designed
// prompt is the only one the user sees.
export const installCaptureScript = `(function(){try{window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__afrobraidInstallEvent=e;window.dispatchEvent(new Event('afrobraid:installable'));});window.addEventListener('appinstalled',function(){window.__afrobraidInstallEvent=null;try{localStorage.setItem('afrobraid:pwa-installed','1')}catch(_){}window.dispatchEvent(new Event('afrobraid:installable'));});}catch(_){}})();`;
