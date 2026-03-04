'use client';

import NotionStyleMarkdown from '@/shared/components/NotionStyleMarkdown';
import '@/shared/components/notion-markdown.css';

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return <NotionStyleMarkdown content={content} />;
}
