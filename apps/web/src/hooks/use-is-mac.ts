import { useSyncExternalStore } from "react";

/**
 * Hook to detect if the user is on a Mac device.
 * Used for showing correct keyboard shortcuts (⌘ vs Ctrl).
 *
 * Uses useSyncExternalStore to avoid hydration mismatch:
 * - Server snapshot returns `false`
 * - Client snapshot checks navigator after hydration
 */
// No-op subscribe - navigator.userAgent is static, no external updates to listen for
// eslint-disable-next-line @typescript-eslint/no-empty-function
const subscribe = () => () => {};
const getSnapshot = () => /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const getServerSnapshot = () => false;

export const useIsMac = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
