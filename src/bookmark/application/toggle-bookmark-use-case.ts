import type { BookmarkRepository } from '@/bookmark/domain/types';

export class ToggleBookmarkUseCase {
  constructor(private readonly repository: BookmarkRepository) {}

  async execute(
    userId: string,
    skillId: string
  ): Promise<{ bookmarked: boolean }> {
    const alreadyBookmarked = await this.repository.isBookmarked(userId, skillId);

    if (alreadyBookmarked) {
      await this.repository.removeBookmark(userId, skillId);
      return { bookmarked: false };
    }

    await this.repository.addBookmark(userId, skillId);
    return { bookmarked: true };
  }
}
