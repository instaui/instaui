/** The single place instaui writes developer warnings (and the only console access in the package). */
export function warn(message: string, ...details: unknown[]): void {
  globalThis.console?.warn(`[instaui] ${message}`, ...details);
}
