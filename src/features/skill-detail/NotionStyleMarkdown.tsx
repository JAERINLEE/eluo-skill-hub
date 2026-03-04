'use client';

import { useMemo, type ReactNode, type ComponentProps } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { parseFrontmatter } from '@/shared/utils/parse-frontmatter';
import FrontmatterCard from './FrontmatterCard';
import './notion-markdown.css';

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

function extractLanguage(className: string | undefined): string | null {
  if (!className) return null;
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : null;
}

const components: Components = {
  table: ({ children, ...props }) => (
    <div className="notion-table-wrapper">
      <table {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead {...props}>{children}</thead>
  ),
  th: ({ children, ...props }) => (
    <th {...props}>{children}</th>
  ),
  td: ({ children, ...props }) => (
    <td {...props}>{children}</td>
  ),
  pre: ({ children, ...props }) => {
    const codeChild = (
      Array.isArray(children) ? children[0] : children
    ) as ReactNode & { props?: { className?: string } };

    const language = extractLanguage(codeChild?.props?.className);

    return (
      <div className="notion-code-block">
        {language && (
          <div className="notion-code-header">
            {language}
          </div>
        )}
        <pre {...props}>{children}</pre>
      </div>
    );
  },
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
      <code className="notion-inline-code" {...props}>
        {children}
      </code>
    );
  },
  a: ({ children, ...props }) => (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
};

interface NotionStyleMarkdownProps {
  content: string;
}

type RehypePlugin = ComponentProps<typeof Markdown>['rehypePlugins'];

export default function NotionStyleMarkdown({ content }: NotionStyleMarkdownProps) {
  const { metadata, content: markdownBody } = useMemo(
    () => parseFrontmatter(content),
    [content],
  );

  const hasCodeBlock = useMemo(
    () => /```[\s\S]*?```/.test(markdownBody),
    [markdownBody],
  );

  const rehypePlugins: RehypePlugin = useMemo(
    () =>
      hasCodeBlock
        ? [[rehypeSanitize, sanitizeSchema], rehypeHighlight]
        : [[rehypeSanitize, sanitizeSchema]],
    [hasCodeBlock],
  );

  if (!content || !content.trim()) return null;

  return (
    <div className="notion-markdown">
      {metadata && Object.keys(metadata).length > 0 && (
        <FrontmatterCard metadata={metadata} />
      )}
      <article className="prose max-w-none">
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {markdownBody}
        </Markdown>
      </article>
    </div>
  );
}
