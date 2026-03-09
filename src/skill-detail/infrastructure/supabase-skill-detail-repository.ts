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
        'id, title, description, version, markdown_content, created_at, updated_at, author_id, download_count, tags, categories(name, icon)'
      )
      .eq('id', skillId)
      .single();

    if (error || !skill) return null;

    // Parallelize independent queries: author profile, templates, feedback stats
    const authorId = skill.author_id as string | null;

    const [authorResult, templatesResult, feedbackCountResult] = await Promise.all([
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
      // Feedback count
      supabase
        .from('skill_feedback_logs')
        .select('*', { count: 'exact', head: true })
        .eq('skill_id', skillId),
    ]);

    const authorName = (authorResult.data?.name as string | null) ?? null;
    const templates = templatesResult.data;
    const feedbackCount = feedbackCountResult.count ?? 0;

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
      description: (skill.description as string | null) ?? null,
      categoryName: category.name,
      categoryIcon: category.icon,
      version: (skill.version as string) ?? '1.0.0',
      tags: (skill.tags as string[] | null) ?? [],
      markdownContent: (skill.markdown_content as string | null) ?? null,
      authorName,
      createdAt: skill.created_at as string,
      updatedAt: skill.updated_at as string,
      templates: templateInfos,
      downloadCount: (skill.download_count as number) ?? 0,
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
        .select('id, rating, comment, created_at, user_id, is_secret, deleted_at')
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

    // 먼저 replies 를 가져온 뒤, 피드백 작성자 + 답글 작성자의 user_id 를 합산하여
    // 단 한 번의 profiles 조회로 처리 (기존의 2-query 패턴 제거)
    const repliesResult = await supabase
      .from('feedback_replies')
      .select('id, feedback_id, content, created_at, user_id')
      .in('feedback_id', feedbackIds)
      .order('created_at', { ascending: true });

    const replies = repliesResult.data ?? [];

    // 피드백 작성자 ID + 답글 작성자 ID 를 합산해 중복 제거 후 단일 조회
    const replyUserIds = replies.map((r) => r.user_id as string).filter(Boolean);
    const allUserIds = [...new Set([...feedbackUserIds, ...replyUserIds])];

    const profileMap = new Map<string, string | null>();
    if (allUserIds.length > 0) {
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', allUserIds);

      for (const p of allProfiles ?? []) {
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
        userId: reply.user_id as string,
        createdAt: reply.created_at as string,
      });
      repliesByFeedbackId.set(feedbackId, existing);
    }

    const mappedFeedbacks: FeedbackWithReplies[] = feedbacks.map((f) => ({
      id: f.id as string,
      rating: (f.rating as number | null) ?? null,
      comment: (f.comment as string | null) ?? null,
      userName: profileMap.get(f.user_id as string) ?? null,
      userId: f.user_id as string,
      isSecret: (f.is_secret as boolean) ?? false,
      isDeleted: f.deleted_at !== null,
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
        comment: input.comment,
        is_secret: input.isSecret ?? false,
      })
      .select('id, rating, comment, created_at, is_secret')
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
      rating: (data.rating as number | null) ?? null,
      comment: (data.comment as string | null) ?? null,
      userName: (profile?.name as string | null) ?? null,
      userId,
      isSecret: (data.is_secret as boolean) ?? false,
      isDeleted: false,
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
      userId,
      createdAt: data.created_at as string,
    };
  }

  async getFeedbackReplyCount(feedbackId: string): Promise<number> {
    const supabase = await createClient();
    const { count } = await supabase
      .from('feedback_replies')
      .select('*', { count: 'exact', head: true })
      .eq('feedback_id', feedbackId);
    return count ?? 0;
  }

  async deleteReply(replyId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('feedback_replies').delete().eq('id', replyId);
    if (error) throw new Error('댓글 삭제에 실패했습니다.');
  }

  async deleteFeedback(feedbackId: string): Promise<void> {
    const supabase = await createClient();

    // 대댓글과 피드백 본체를 병렬로 삭제
    const [, feedbackResult] = await Promise.all([
      supabase.from('feedback_replies').delete().eq('feedback_id', feedbackId),
      supabase.from('skill_feedback_logs').delete().eq('id', feedbackId),
    ]);

    if (feedbackResult.error) throw new Error('피드백 삭제에 실패했습니다.');
  }

  async softDeleteFeedback(feedbackId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('skill_feedback_logs')
      .update({ deleted_at: new Date().toISOString(), comment: null })
      .eq('id', feedbackId);
    if (error) throw new Error('피드백 삭제에 실패했습니다.');
  }

  async incrementDownloadCount(skillId: string): Promise<void> {
    const supabase = await createClient();
    await supabase.rpc('increment_download_count', { skill_id_param: skillId });
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
