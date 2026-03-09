'use client';

import { use } from 'react';
import { useIsViewer } from '@/features/dashboard/DashboardLayoutClient';
import SkillDetailModal from '@/features/skill-detail/SkillDetailModal';
import { useRouter } from 'next/navigation';

interface SkillDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SkillDetailPage({ params }: SkillDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const isViewer = useIsViewer();

  return (
    <SkillDetailModal
      skillId={id}
      isViewer={isViewer}
      onClose={() => router.push('/dashboard')}
    />
  );
}
