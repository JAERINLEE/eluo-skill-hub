import { parseFrontmatter } from '../parse-frontmatter';

describe('parseFrontmatter', () => {
  it('should parse valid YAML frontmatter and return metadata + content', () => {
    const input = `---
version: "1.0"
author: "Team Eluo"
---

# Hello World`;

    const result = parseFrontmatter(input);

    expect(result.metadata).toEqual({
      version: '1.0',
      author: 'Team Eluo',
    });
    expect(result.content.trim()).toBe('# Hello World');
  });

  it('should return null metadata when no frontmatter exists', () => {
    const input = '# No frontmatter here';

    const result = parseFrontmatter(input);

    expect(result.metadata).toBeNull();
    expect(result.content).toBe('# No frontmatter here');
  });

  it('should return null metadata for invalid YAML frontmatter', () => {
    const input = `---
invalid yaml: [
---
# Body content`;

    const result = parseFrontmatter(input);

    expect(result.metadata).toBeNull();
    expect(result.content).toBe(input);
  });

  it('should return null metadata and empty content for empty string', () => {
    const result = parseFrontmatter('');

    expect(result.metadata).toBeNull();
    expect(result.content).toBe('');
  });

  it('should handle frontmatter with array values', () => {
    const input = `---
tags:
  - automation
  - design
---

# Content`;

    const result = parseFrontmatter(input);

    expect(result.metadata).toEqual({
      tags: ['automation', 'design'],
    });
    expect(result.content.trim()).toBe('# Content');
  });

  it('should handle frontmatter with empty data block', () => {
    const input = `---
---

# Content`;

    const result = parseFrontmatter(input);

    expect(result.metadata).toBeNull();
    expect(result.content.trim()).toBe('# Content');
  });

  it('should handle multiline values in frontmatter', () => {
    const input = `---
description: |
  This is a long
  multiline value
version: "2.0"
---

# Body`;

    const result = parseFrontmatter(input);

    expect(result.metadata).not.toBeNull();
    expect(result.metadata?.version).toBe('2.0');
    expect(typeof result.metadata?.description).toBe('string');
    expect(result.content.trim()).toBe('# Body');
  });
});
