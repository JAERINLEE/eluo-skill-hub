export type EventName =
  | 'auth.signin'
  | 'auth.signup'
  | 'auth.signout'
  | 'skill.view'
  | 'skill.bookmark_add'
  | 'skill.bookmark_remove'
  | 'skill.template_download'
  | 'search.query'
  | 'search.tag'
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
  'search.tag': { tag: string };
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

// Analytics types

export interface AnalyticsDateRange {
  readonly startDate: string; // ISO 8601 timestamptz
  readonly endDate: string;   // ISO 8601 timestamptz
}

export interface AnalyticsOverview {
  readonly activeUsers: number;
  readonly skillViews: number;
  readonly templateDownloads: number;
  readonly activeUsersChange: number;
  readonly skillViewsChange: number;
  readonly templateDownloadsChange: number;
}

export interface DailyTrendItem {
  readonly date: string; // YYYY-MM-DD
  readonly skillViews: number;
  readonly templateDownloads: number;
}

export interface SkillRankingItem {
  readonly skillId: string;
  readonly skillTitle: string;
  readonly viewCount: number;
  readonly downloadCount: number;
  readonly bookmarkCount: number;
}

export interface SidebarClickItem {
  readonly tab: string;
  readonly clickCount: number;
}

export interface UserBehaviorData {
  readonly sidebarClicks: readonly SidebarClickItem[];
}

export interface AnalyticsRepository {
  getOverview(range: AnalyticsDateRange): Promise<AnalyticsOverview>;
  getDailyTrend(range: AnalyticsDateRange): Promise<readonly DailyTrendItem[]>;
  getSkillRankings(range: AnalyticsDateRange, limit?: number): Promise<readonly SkillRankingItem[]>;
  getUserBehavior(range: AnalyticsDateRange): Promise<UserBehaviorData>;
}
