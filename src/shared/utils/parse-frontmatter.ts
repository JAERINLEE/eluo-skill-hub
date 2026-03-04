import matter from 'gray-matter';

interface ParsedFrontmatter {
  metadata: Record<string, unknown> | null;
  content: string;
}

export function parseFrontmatter(rawContent: string): ParsedFrontmatter {
  if (!rawContent || !rawContent.trimStart().startsWith('---')) {
    return { metadata: null, content: rawContent };
  }

  try {
    const { data, content } = matter(rawContent);

    if (!data || Object.keys(data).length === 0) {
      return { metadata: null, content };
    }

    return { metadata: data as Record<string, unknown>, content };
  } catch {
    return { metadata: null, content: rawContent };
  }
}
