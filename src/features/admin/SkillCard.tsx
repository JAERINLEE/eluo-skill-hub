'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Blocks, Clock } from 'lucide-react';
import type { SkillRow } from '@/admin/domain/types';
import { useDeleteSkill } from '@/admin/hooks/use-admin-mutations';
import SkillDeleteConfirmDialog from '@/features/admin/SkillDeleteConfirmDialog';

interface SkillCardProps {
  skill: SkillRow;
}

export default function SkillCard({ skill }: SkillCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteSkillMutation, isPending: isDeleting } = useDeleteSkill();

  const handleDelete = () => {
    deleteSkillMutation(skill.id, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('스킬이 삭제되었습니다');
          setIsDeleteDialogOpen(false);
        } else {
          toast.error(result.error);
        }
      },
      onError: () => {
        toast.error('스킬 삭제 중 오류가 발생했습니다');
      },
    });
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg shadow-[#000080]/5 rounded-2xl p-6 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="flex justify-between items-start mb-4">
        {skill.status === 'published' ? (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">
            Published
          </span>
        ) : (
          <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full uppercase">
            Draft
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{skill.title}</h3>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{skill.description ?? ''}</p>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Blocks className='size-4' />
          <span>{skill.categoryName}</span>
          <span className="ml-1 px-2 py-0.5 bg-[#00007F]/10 text-[#00007F] text-[10px] font-semibold rounded-full">
            v{skill.version}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-1">
          <Clock className='size-4' />
          <span>{new Date(skill.updatedAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-100 text-[10px] font-medium rounded-full text-slate-500"
              >
                #{tag}
              </span>
            ))}
            {skill.tags.length > 3 && (
              <span className="px-2 py-0.5 text-[10px] text-slate-400">+{skill.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
      <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
        <Link
          href={`/admin/skills/edit/${skill.id}`}
          className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors text-center"
        >
          수정
        </Link>
        <button
          type="button"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors"
        >
          삭제
        </button>
      </div>

      <SkillDeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        skillTitle={skill.title}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
