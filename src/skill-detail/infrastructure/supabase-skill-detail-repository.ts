import { createClient } from '@/shared/infrastructure/supabase/server';
import type { ISkillDetailRepository } from '../application/ports';
import type {
  SkillDetailPopup,
  SkillTemplateInfo,
  PaginatedFeedbacks,
  FeedbackWithReplies,
  FeedbackReply,
  SubmitFeedbackInput,
  SubmitReplyInput,
} from '../domain/types';

type JoinedName = { name: string } | { name: string }[] | null;

function extractName(joined: JoinedName): string | null {
  if (!joined) return null;
  if (Array.isArray(joined)) return joined[0]?.name ?? null;
  return joined.name;
}

type JoinedCategory = { name: string; icon: string } | { name: string; icon: string }[] | null;

function extractCategory(joined: JoinedCategory): { name: string; icon: string } {
  if (!joined) return { name: '', icon: '' };
  if (Array.isArray(joined)) return { name: joined[0]?.name ?? '', icon: joined[0]?.icon ?? '' };
  return { name: joined.name, icon: joined.icon };
}

export class SupabaseSkillDetailRepository implements ISkillDetailRepository {
  async getSkillDetailPopup(skillId: string): Promise<SkillDetailPopup | null> {
    const supabase = await createClient();

    const { data: skill, error } = await supabase
      .from('skills')
      .select(
        'id, title, icon, description, markdown_content, updated_at, author_id, categories(name, icon)'
      )
      .eq('id', skillId)
      .single();

    if (error || !skill) return null;

    // Parallelize independent queries: author profile, templates, feedback stats
    const authorId = skill.author_id as string | null;

    const [authorResult, templatesResult, feedbackStatsResult] = await Promise.all([
      // Author name (only if author_id exists)
      authorId
        ? supabase.from('profiles').select('name').eq('id', authorId).single()
        : Promise.resolve({ data: null }),
      // Templates
      supabase
        .from('skill_templates')
        .select('id, file_name, file_path, file_size, file_type')
        .eq('skill_id', skillId)
        .order('created_at', { ascending: true }),
      // Feedback stats
      supabase
        .from('skill_feedback_logs')
        .select('rating')
        .eq('skill_id', skillId),
    ]);

    const authorName = (authorResult.data?.name as string | null) ?? null;
    const templates = templatesResult.data;

    const ratings = feedbackStatsResult.data ?? [];
    const feedbackCount = ratings.length;
    const avgRating =
      feedbackCount > 0
        ? ratings.reduce((sum, r) => sum + (r.rating as number), 0) / feedbackCount
        : null;

    const category = extractCategory(skill.categories as JoinedCategory);

    const templateInfos: SkillTemplateInfo[] = (templates ?? []).map((t) => ({
      id: t.id as string,
      fileName: t.file_name as string,
      filePath: t.file_path as string,
      fileSize: t.file_size as number,
      fileType: t.file_type as string,
    }));

    return {
      id: skill.id as string,
      title: skill.title as string,
      icon: (skill.icon as string) ?? '',
      description: (skill.description as string | null) ?? null,
      categoryName: category.name,
      categoryIcon: category.icon,
      markdownContent: (skill.markdown_content as string | null) ?? null,
      authorName,
      updatedAt: skill.updated_at as string,
      templates: templateInfos,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      feedbackCount,
    };
  }

  async getFeedbacksWithReplies(
    skillId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PaginatedFeedbacks> {
    const supabase = await createClient();

    // Fetch paginated feedbacks and total count in parallel
    const [feedbacksResult, countResult] = await Promise.all([
      supabase
        .from('skill_feedback_logs')
        .select('id, rating, comment, created_at, user_id')
        .eq('skill_id', skillId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('skill_feedback_logs')
        .select('*', { count: 'exact', head: true })
        .eq('skill_id', skillId),
    ]);

    const feedbacks = feedbacksResult.data;
    const totalCount = countResult.count ?? 0;

    if (!feedbacks || feedbacks.length === 0) {
      return { feedbacks: [], totalCount, hasMore: false };
    }

    const feedbackUserIds = feedbacks
      .map((f) => f.user_id as string)
      .filter(Boolean);
    const feedbackIds = feedbacks.map((f) => f.id as string);

    // Parallelize: replies and feedback-author profiles
    const [repliesResult, feedbackProfilesResult] = await Promise.all([
      supabase
        .from('feedback_replies')
        .select('id, feedback_id, content, created_at, user_id')
        .in('feedback_id', feedbackIds)
        .order('created_at', { ascending: true }),
      feedbackUserIds.length > 0
        ? supabase.from('profiles').select('id, name').in('id', feedbackUserIds)
        : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
    ]);

    const profileMap = new Map<string, string | null>();
    for (const p of feedbackProfilesResult.data ?? []) {
      profileMap.set(p.id as string, (p.name as string | null) ?? null);
    }

    // Collect reply user IDs and fetch missing profiles
    const replies = repliesResult.data ?? [];
    const replyUserIds = replies
      .map((r) => r.user_id as string)
      .filter((id) => id && !profileMap.has(id));

    if (replyUserIds.length > 0) {
      const uniqueReplyUserIds = [...new Set(replyUserIds)];
      const { data: replyProfiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', uniqueReplyUserIds);

      for (const p of replyProfiles ?? []) {
        profileMap.set(p.id as string, (p.name as string | null) ?? null);
      }
    }

    // Build replies map
    const repliesByFeedbackId = new Map<string, FeedbackReply[]>();
    for (const reply of replies) {
      const feedbackId = reply.feedback_id as string;
      const existing = repliesByFeedbackId.get(feedbackId) ?? [];
      existing.push({
        id: reply.id as string,
        content: reply.content as string,
        userName: profileMap.get(reply.user_id as string) ?? null,
        createdAt: reply.created_at as string,
      });
      repliesByFeedbackId.set(feedbackId, existing);
    }

    const mappedFeedbacks: FeedbackWithReplies[] = feedbacks.map((f) => ({
      id: f.id as string,
      rating: f.rating as number,
      comment: (f.comment as string | null) ?? null,
      userName: profileMap.get(f.user_id as string) ?? null,
      createdAt: f.created_at as string,
      replies: repliesByFeedbackId.get(f.id as string) ?? [],
    }));

    return {
      feedbacks: mappedFeedbacks,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }

  async submitFeedback(userId: string, input: SubmitFeedbackInput): Promise<FeedbackWithReplies> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('skill_feedback_logs')
      .insert({
        user_id: userId,
        skill_id: input.skillId,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .select('id, rating, comment, created_at')
      .single();

    if (error || !data) {
      throw new Error('피드백 저장에 실패했습니다.');
    }

    // Get user name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    return {
      id: data.id as string,
      rating: data.rating as number,
      comment: (data.comment as string | null) ?? null,
      userName: (profile?.name as string | null) ?? null,
      createdAt: data.created_at as string,
      replies: [],
    };
  }

  async submitReply(userId: string, input: SubmitReplyInput): Promise<FeedbackReply> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('feedback_replies')
      .insert({
        feedback_id: input.feedbackId,
        user_id: userId,
        content: input.content,
      })
      .select('id, content, created_at')
      .single();

    if (error || !data) {
      throw new Error('댓글 저장에 실패했습니다.');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    return {
      id: data.id as string,
      content: data.content as string,
      userName: (profile?.name as string | null) ?? null,
      createdAt: data.created_at as string,
    };
  }

  async getTemplateSignedUrl(filePath: string, bucket: string): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60);

    if (error || !data?.signedUrl) {
      throw new Error('다운로드 URL 생성에 실패했습니다.');
    }

    return data.signedUrl;
  }

  async getUserRole(userId: string): Promise<string | null> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('profiles')
      .select('roles(name)')
      .eq('id', userId)
      .single();

    if (!data) return null;
    return extractName(data.roles as JoinedName);
  }
}
