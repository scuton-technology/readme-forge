import { describe, it, expect } from 'vitest';
import { analyzeProject } from '../src/lib/analyzer.js';
import { join } from 'path';

describe('analyzeProject', () => {
  const rootDir = join(import.meta.dirname, '..');

  it('should analyze current project', () => {
    const analysis = analyzeProject(rootDir);
    expect(analysis.name).toBe('readme-forge');
    expect(analysis.language).toBe('typescript');
    expect(analysis.hasDocker).toBe(false);
  });

  it('should detect frameworks', () => {
    const analysis = analyzeProject(rootDir);
    expect(analysis.frameworks).toContain('Commander.js');
  });

  it('should detect package manager', () => {
    const analysis = analyzeProject(rootDir);
    expect(analysis.packageManager).toBe('npm');
  });

  it('should build file tree', () => {
    const analysis = analyzeProject(rootDir);
    expect(analysis.fileTree).toContain('src');
  });

  it('should detect scripts', () => {
    const analysis = analyzeProject(rootDir);
    expect(analysis.scripts).toHaveProperty('build');
    expect(analysis.scripts).toHaveProperty('test');
  });

  it('should detect dependencies', () => {
    const analysis = analyzeProject(rootDir);
    expect(analysis.dependencies).toContain('commander');
    expect(analysis.dependencies).toContain('@anthropic-ai/sdk');
  });

  it('should detect dev dependencies', () => {
    const analysis = analyzeProject(rootDir);
    expect(analysis.devDependencies).toContain('typescript');
    expect(analysis.devDependencies).toContain('vitest');
  });

  it('should detect CI', () => {
    const analysis = analyzeProject(rootDir);
    expect(analysis.hasCI).toBe(true);
  });

  it('should detect license', () => {
    const analysis = analyzeProject(rootDir);
    expect(analysis.license).toBe('MIT');
  });

  it('should find entry point preview', () => {
    const analysis = analyzeProject(rootDir);
    expect(analysis.entryPointPreview).toBeTruthy();
    expect(analysis.entryPointPreview).toContain('commander');
  });
});
