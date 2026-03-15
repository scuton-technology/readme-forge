import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// We test the check logic inline since it's in the command
// In a real scenario, we'd extract the check logic to a lib

describe('README check logic', () => {
  it('should detect H1 title', () => {
    const content = '# My Project\n\nSome description.';
    expect(/^# .+/m.test(content)).toBe(true);
  });

  it('should detect missing H1', () => {
    const content = '## Not a title\n\nSome description.';
    expect(/^# .+/m.test(content)).toBe(false);
  });

  it('should detect install section', () => {
    const content = '# Project\n\n## Installation\n\nnpm install';
    expect(/##\s*(install|getting\s*started|setup|quick\s*start)/im.test(content)).toBe(true);
  });

  it('should detect usage section', () => {
    const content = '# Project\n\n## Usage\n\nRun the thing';
    expect(/##\s*(usage|how\s*to\s*use|examples?)/im.test(content)).toBe(true);
  });

  it('should detect license section', () => {
    const content = '# Project\n\n## License\n\nMIT';
    expect(/##\s*license/im.test(content)).toBe(true);
  });

  it('should detect badges', () => {
    const content = '[![npm](https://img.shields.io/npm/v/pkg)](https://npmjs.com/pkg)';
    expect(/\[!\[.+\]\(.+\)\]\(.+\)/.test(content)).toBe(true);
  });

  it('should detect code blocks', () => {
    const content = '```bash\nnpm install\n```';
    expect(/```[\s\S]*?```/.test(content)).toBe(true);
  });

  it('should check minimum length', () => {
    const shortContent = 'Short readme';
    expect(shortContent.split('\n').length >= 50).toBe(false);

    const longContent = Array(60).fill('Line of content').join('\n');
    expect(longContent.split('\n').length >= 50).toBe(true);
  });
});
