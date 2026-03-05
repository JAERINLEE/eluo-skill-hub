export type EventName =
  | 'auth.signin'
  | 'auth.signup'
  | 'auth.signout'
  | 'skill.view'
  | 'skill.bookmark_add'
  | 'skill.bookmark_remove'
  | 'skill.template_download'
  | 'search.query'
  | 'nav.sidebar_click';

export interface EventPropertiesMap {
  'auth.signin': { email: string };
  'auth.signup': { email: string };
  'auth.signout': Record<string, never>;
  'skill.view': { skill_id: string };
  'skill.bookmark_add': { skill_id: string };
  'skill.bookmark_remove': { skill_id: string };
  'skill.template_download': { skill_id: string; template_id: string };
  'search.query': { query: string };
  'nav.sidebar_click': { tab: string };
}

export interface EventLogInsert<T extends EventName = EventName> {
  event_name: T;
  user_id?: string;
  session_id?: string;
  properties: EventPropertiesMap[T];
  page_url?: string;
  user_agent?: string;
}

export interface EventLogRepository {
  insert(event: EventLogInsert): Promise<void>;
  insertBatch(events: EventLogInsert[]): Promise<void>;
}
