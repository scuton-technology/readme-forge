import { describe, it, expect } from 'vitest';
import { detectBadges, formatBadges } from '../src/lib/badges.js';
import { join } from 'path';

describe('badge detection', () => {
  const rootDir = join(import.meta.dirname, '..');

  it('should detect badges for current project', () => {
    const badges = detectBadges(rootDir);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should detect npm version badge', () => {
    const badges = detectBadges(rootDir);
    const npmBadge = badges.find(b => b.label === 'npm version');
    expect(npmBadge).toBeDefined();
    expect(npmBadge!.markdown).toContain('readme-forge');
  });

  it('should detect license badge', () => {
    const badges = detectBadges(rootDir);
    const licenseBadge = badges.find(b => b.label === 'License');
    expect(licenseBadge).toBeDefined();
    expect(licenseBadge!.markdown).toContain('MIT');
  });

  it('should detect TypeScript badge', () => {
    const badges = detectBadges(rootDir);
    const tsBadge = badges.find(b => b.label === 'TypeScript');
    expect(tsBadge).toBeDefined();
    expect(tsBadge!.markdown).toContain('TypeScript');
  });

  it('should detect Node.js badge', () => {
    const badges = detectBadges(rootDir);
    const nodeBadge = badges.find(b => b.label === 'Node.js');
    expect(nodeBadge).toBeDefined();
    expect(nodeBadge!.markdown).toContain('node');
  });

  it('should format badges as markdown', () => {
    const badges = detectBadges(rootDir);
    const formatted = formatBadges(badges);
    expect(formatted).toContain('[![');
    expect(formatted).toContain('img.shields.io');
  });
});
