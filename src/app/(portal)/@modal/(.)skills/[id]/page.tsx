'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useIsViewer } from '@/features/dashboard/DashboardLayoutClient';
import SkillDetailModal from '@/features/skill-detail/SkillDetailModal';

interface SkillModalPageProps {
  params: Promise<{ id: string }>;
}

export default function SkillModalPage({ params }: SkillModalPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const isViewer = useIsViewer();

  return (
    <SkillDetailModal
      skillId={id}
      isViewer={isViewer}
      onClose={() => router.back()}
    />
  );
}
