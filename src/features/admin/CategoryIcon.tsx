import { Bug, Terminal, FileEdit, Paintbrush, Code, type LucideIcon, Zap } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  BugReportIcon: Bug,
  TerminalIcon: Terminal,
  EditNoteIcon: FileEdit,
  BrushIcon: Paintbrush,
  CodeIcon: Code,
};

interface CategoryIconProps {
  icon: string;
  size?: number;
  className?: string;
}

export default function CategoryIcon({ icon, size = 16, className }: CategoryIconProps) {
  const Icon = ICON_MAP[icon] ?? Zap;
  return <Icon size={size} className={className} />;
}
