// L'app iOS e' questo stesso sito dentro una WebView (cartella ios-app/):
// si riconosce dallo user agent e le si chiede di fare cio' che il web non puo'.
export const inNativeApp = (): boolean =>
  typeof navigator !== 'undefined' && navigator.userAgent.includes('FrigoRadarApp');

export function askNativeApp(msg: Record<string, unknown>): void {
  (window as any).ReactNativeWebView?.postMessage(JSON.stringify(msg));
}
