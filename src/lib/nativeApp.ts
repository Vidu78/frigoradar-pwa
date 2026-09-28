// L'app iOS e' questo stesso sito dentro una WebView (cartella ios-app/):
// si riconosce dallo user agent e le si chiede di fare cio' che il web non puo'.
export const inNativeApp = (): boolean =>
  typeof navigator !== 'undefined' && navigator.userAgent.includes('FrigoRadarApp');

export function askNativeApp(msg: Record<string, unknown>): void {
  (window as any).ReactNativeWebView?.postMessage(JSON.stringify(msg));
}

// Nell'app iOS il PRO non si puo' comprare (Apple vieta pagamenti esterni):
// chi non e' PRO non vede proprio le schede che ne dipendono.
export const TAB_SOLO_PRO = ['shopping', 'recipes'];
export const nascondiPro = (isPro: boolean): boolean => inNativeApp() && !isPro;
