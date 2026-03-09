export interface DashboardStats {
  readonly totalMembers: number;
  readonly totalSkills: number;
  readonly totalFeedbacks: number;
}

export interface RecentSkill {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly categoryName: string;
  readonly createdAt: string;
}

export interface RecentMember {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly roleName: string;
  readonly createdAt: string;
}

export interface MemberRow {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly roleName: string;
  readonly roleId: string;
  readonly createdAt: string;
  readonly status: 'active' | 'pending';
}

export interface Role {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
}

export interface Permission {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
}

export interface RolePermission {
  readonly id: string;
  readonly roleId: string;
  readonly permissionId: string;
}

export type SkillStatusFilter = 'all' | 'published' | 'drafted';

export interface SkillRow {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly categoryName: string;
  readonly categoryIcon: string;
  readonly status: 'published' | 'drafted';
  readonly version: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CategoryOption {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}

export interface CreateSkillInput {
  readonly categoryId: string;
  readonly title: string;
  readonly description: string;
  readonly version: string;
  readonly tags: readonly string[];
  readonly isPublished: boolean;
  readonly markdownFile?: File;
  readonly templateFiles?: File[];
}

export type CreateSkillResult =
  | { success: true; skillId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export interface SkillTemplateRow {
  readonly id: string;
  readonly skillId: string;
  readonly fileName: string;
  readonly filePath: string;
  readonly fileSize: number;
  readonly fileType: string;
  readonly createdAt: string;
}

export interface FeedbackRow {
  readonly id: string;
  readonly rating: number;
  readonly comment: string | null;
  readonly userName: string;
  readonly skillTitle: string;
  readonly createdAt: string;
}

export interface PaginatedResult<T> {
  readonly data: T[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export interface SkillStatusCounts {
  readonly published: number;
  readonly drafted: number;
}

export interface VersionHistoryEntry {
  readonly version: string;
  readonly changedAt: string;
  readonly note: string | null;
}

export interface SkillDetail {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly categoryId: string;
  readonly categoryName: string;
  readonly categoryIcon: string;
  readonly status: 'published' | 'drafted';
  readonly version: string;
  readonly tags: readonly string[];
  readonly markdownFilePath: string;
  readonly markdownContent: string;
  readonly templates: SkillTemplateRow[];
  readonly versionHistory: VersionHistoryEntry[];
  readonly createdAt: string;
}

export interface UpdateSkillInput {
  readonly skillId: string;
  readonly categoryId: string;
  readonly title: string;
  readonly description: string;
  readonly version: string;
  readonly tags: readonly string[];
  readonly isPublished: boolean;
  readonly markdownFile?: File;
  readonly removeMarkdown: boolean;
  readonly templateFiles?: File[];
  readonly removedTemplateIds: string[];
}

export type UpdateSkillResult =
  | { success: true; skillId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export type GetSkillResult =
  | { success: true; skill: SkillDetail }
  | { success: false; error: string };

export type DeleteSkillResult =
  | { success: true }
  | { success: false; error: string };

export interface AdminRepository {
  getDashboardStats(): Promise<DashboardStats>;
  getRecentSkills(limit: number): Promise<RecentSkill[]>;
  getRecentMembers(limit: number): Promise<RecentMember[]>;
  getMembers(page: number, pageSize: number, search?: string, currentUserId?: string): Promise<PaginatedResult<MemberRow>>;
  getMemberById(id: string): Promise<MemberRow | null>;
  getSkills(page: number, pageSize: number, search?: string, status?: SkillStatusFilter, categoryId?: string): Promise<PaginatedResult<SkillRow>>;
  getSkillStatusCounts(): Promise<SkillStatusCounts>;
  getFeedbacks(page: number, pageSize: number): Promise<PaginatedResult<FeedbackRow>>;
  getAllRoles(): Promise<Role[]>;
  updateMemberRole(memberId: string, roleId: string): Promise<void>;
  getAdminCount(): Promise<number>;
  getMemberRole(memberId: string): Promise<string | null>;
  getPermissionsByRole(roleId: string): Promise<Permission[]>;
  createSkill(input: CreateSkillInput): Promise<CreateSkillResult>;
  getSkillById(id: string): Promise<GetSkillResult>;
  updateSkill(input: UpdateSkillInput): Promise<UpdateSkillResult>;
  getCategories(): Promise<CategoryOption[]>;
  deleteSkill(skillId: string): Promise<DeleteSkillResult>;
}
