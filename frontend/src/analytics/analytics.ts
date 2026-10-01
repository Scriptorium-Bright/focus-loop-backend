export type AnalyticsEventName =
  | 'app_opened'
  | 'home_viewed'
  | 'task_entered'
  | 'duration_selected'
  | 'session_start_requested'
  | 'departure_started'
  | 'departure_skipped'
  | 'session_active'
  | 'focus_ui_hidden'
  | 'focus_ui_revealed'
  | 'pause_requested'
  | 'harbor_search_started'
  | 'harbor_search_skipped'
  | 'harbor_search_cancelled'
  | 'rest_started'
  | 'rest_completed'
  | 'resume_requested'
  | 'session_arriving'
  | 'task_completion_selected'
  | 'logbook_saved'
  | 'skin_previewed'
  | 'skin_purchase_started'
  | 'skin_purchase_completed'
  | 'session_restarted_from_log';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  createdAt: string;
  properties: Record<string, string | number | boolean>;
}

const safeProperties = (properties: Record<string, unknown>) => Object.fromEntries(
  Object.entries(properties)
    .filter(([key, value]) => !/^(title|task_?title|note|text|content)$/i.test(key) && ['string', 'number', 'boolean'].includes(typeof value))
    .map(([key, value]) => [key, value as string | number | boolean]),
);

export const taskLengthBucket = (value: string) => value.length < 10 ? '0-9' : value.length < 30 ? '10-29' : value.length < 80 ? '30-79' : '80+';

export class LocalAnalytics {
  private events: AnalyticsEvent[] = [];

  track(name: AnalyticsEventName, properties: Record<string, unknown> = {}) {
    this.events.push({ name, createdAt: new Date().toISOString(), properties: safeProperties(properties) });
    if (this.events.length > 100) this.events.shift();
  }

  snapshot() {
    return [...this.events];
  }
}
