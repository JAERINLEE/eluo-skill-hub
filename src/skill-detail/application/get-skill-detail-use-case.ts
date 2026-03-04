import type { ISkillDetailRepository } from './ports';
import type { GetSkillDetailResult } from '../domain/types';

export class GetSkillDetailUseCase {
  constructor(private readonly repository: ISkillDetailRepository) {}

  async execute(skillId: string): Promise<GetSkillDetailResult> {
    const skill = await this.repository.getSkillDetailPopup(skillId);

    if (!skill) {
      return { success: false, error: '스킬을 찾을 수 없습니다.' };
    }

    return { success: true, skill };
  }
}
