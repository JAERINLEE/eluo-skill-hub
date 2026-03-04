import { createClient } from '@/shared/infrastructure/supabase/server';
import type { ISkillDetailRepository } from '../application/ports';
import type {
  SkillDetailPopup,
  SkillTemplateInfo,
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

    // Get author name via separate profiles query (skills.author_id -> auth.users, no direct FK to profiles)
    const authorId = skill.author_id as string | null;
    let authorName: string | null = null;
    if (authorId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', authorId)
        .single();
      authorName = (profile?.name as string | null) ?? null;
    }

    // Get templates
    const { data: templates } = await supabase
      .from('skill_templates')
      .select('id, file_name, file_path, file_size, file_type')
      .eq('skill_id', skillId)
      .order('created_at', { ascending: true });

    // Get avg rating and feedback count
    const { data: feedbackStats } = await supabase
      .from('skill_feedback_logs')
      .select('rating')
      .eq('skill_id', skillId);

    const ratings = feedbackStats ?? [];
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

  async getFeedbacksWithReplies(skillId: string): Promise<FeedbackWithReplies[]> {
    const supabase = await createClient();

    const { data: feedbacks } = await supabase
      .from('skill_feedback_logs')
      .select('id, rating, comment, created_at, user_id')
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false });

    if (!feedbacks || feedbacks.length === 0) return [];

    // Collect all user IDs (feedback authors)
    const feedbackUserIds = feedbacks
      .map((f) => f.user_id as string)
      .filter(Boolean);

    const feedbackIds = feedbacks.map((f) => f.id as string);

    // Get replies
    const { data: replies } = await supabase
      .from('feedback_replies')
      .select('id, feedback_id, content, created_at, user_id')
      .in('feedback_id', feedbackIds)
      .order('created_at', { ascending: true });

    // Collect reply user IDs
    const replyUserIds = (replies ?? [])
      .map((r) => r.user_id as string)
      .filter(Boolean);

    // Fetch all profiles in one query
    const allUserIds = [...new Set([...feedbackUserIds, ...replyUserIds])];
    const profileMap = new Map<string, string | null>();

    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', allUserIds);

      for (const p of profiles ?? []) {
        profileMap.set(p.id as string, (p.name as string | null) ?? null);
      }
    }

    // Build replies map
    const repliesByFeedbackId = new Map<string, FeedbackReply[]>();
    for (const reply of replies ?? []) {
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

    return feedbacks.map((f) => ({
      id: f.id as string,
      rating: f.rating as number,
      comment: (f.comment as string | null) ?? null,
      userName: profileMap.get(f.user_id as string) ?? null,
      createdAt: f.created_at as string,
      replies: repliesByFeedbackId.get(f.id as string) ?? [],
    }));
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
