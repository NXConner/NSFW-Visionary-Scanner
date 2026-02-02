export {};

declare global {
  interface Window {
    /**
     * Set to true once React has mounted and the app is interactive.
     * Used by boot watchdog logic to detect stalled boots.
     */
    __APP_INTERACTIVE__?: boolean;
  }
}
