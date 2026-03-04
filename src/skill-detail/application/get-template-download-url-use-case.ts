import type { ISkillDetailRepository } from './ports';
import type { GetTemplateDownloadResult } from '../domain/types';

export class GetTemplateDownloadUrlUseCase {
  constructor(private readonly repository: ISkillDetailRepository) {}

  async execute(
    userId: string,
    filePath: string,
    fileName: string,
    bucket: string
  ): Promise<GetTemplateDownloadResult> {
    const role = await this.repository.getUserRole(userId);

    if (role === 'viewer') {
      return {
        success: false,
        error: '템플릿 다운로드는 뷰어 역할에서 사용할 수 없습니다. 관리자에게 권한 변경을 요청하세요.',
        isViewerBlocked: true,
      };
    }

    const signedUrl = await this.repository.getTemplateSignedUrl(filePath, bucket);
    return { success: true, signedUrl, fileName };
  }
}
