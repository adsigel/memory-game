import * as amplitude from "@amplitude/analytics-browser";

const API_KEY = "9bf30ad141f13bd14b72c34747688d1c";
let initialized = false;

export function initAmplitude(): void {
  if (initialized || typeof window === "undefined") return;
  amplitude.init(API_KEY, { autocapture: false });
  initialized = true;
}

export function track(eventName: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  amplitude.track(eventName, properties);
}
