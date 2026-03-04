'use client';

import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['className', /^hljs-/],
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', /^language-/],
    ],
  },
};

const components: Components = {
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-slate-200" {...props}>
        {children}
      </table>
    </div>
  ),
  a: ({ children, ...props }) => (
    <a target="_blank" rel="noopener noreferrer" className="text-[#00007F] hover:underline" {...props}>
      {children}
    </a>
  ),
  pre: ({ children, ...props }) => (
    <pre className="rounded-lg bg-slate-50 p-4 overflow-x-auto" {...props}>
      {children}
    </pre>
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = typeof className === 'string' && /language-/.test(className);
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="bg-slate-100 text-[#00007F] rounded px-1.5 py-0.5 text-sm" {...props}>
        {children}
      </code>
    );
  },
};

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <article className="prose max-w-none">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          rehypeHighlight,
        ]}
        components={components}
      >
        {content}
      </Markdown>
    </article>
  );
}
