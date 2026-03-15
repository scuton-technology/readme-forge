import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

export function readFileSafe(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function execSafe(command: string, cwd: string = '.'): string | null {
  try {
    return execSync(command, { cwd, encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

export function readJsonSafe<T = Record<string, unknown>>(filePath: string): T | null {
  const content = readFileSafe(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export function getGitRemoteUrl(cwd: string = '.'): string | null {
  const url = execSafe('git remote get-url origin', cwd);
  if (!url) return null;
  // Convert SSH URL to HTTPS
  if (url.startsWith('git@')) {
    return url.replace(':', '/').replace('git@', 'https://').replace(/\.git$/, '');
  }
  return url.replace(/\.git$/, '');
}

export function getRecentCommits(cwd: string = '.', count: number = 5): string[] {
  const output = execSafe(`git log --oneline -${count}`, cwd);
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

export function readFirstNLines(filePath: string, n: number = 50): string | null {
  const content = readFileSafe(filePath);
  if (!content) return null;
  return content.split('\n').slice(0, n).join('\n');
}

export function detectLicense(dir: string): string | null {
  const licenseFile = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md'].find(f =>
    existsSync(join(dir, f))
  );
  if (!licenseFile) return null;
  const content = readFileSafe(join(dir, licenseFile));
  if (!content) return null;

  if (content.includes('MIT License') || content.includes('Permission is hereby granted, free of charge')) return 'MIT';
  if (content.includes('Apache License') && content.includes('2.0')) return 'Apache-2.0';
  if (content.includes('GNU GENERAL PUBLIC LICENSE') && content.includes('Version 3')) return 'GPL-3.0';
  if (content.includes('GNU GENERAL PUBLIC LICENSE') && content.includes('Version 2')) return 'GPL-2.0';
  if (content.includes('BSD 2-Clause')) return 'BSD-2-Clause';
  if (content.includes('BSD 3-Clause')) return 'BSD-3-Clause';
  if (content.includes('ISC License')) return 'ISC';
  if (content.includes('Mozilla Public License')) return 'MPL-2.0';
  if (content.includes('Unlicense')) return 'Unlicense';

  return 'Custom';
}
