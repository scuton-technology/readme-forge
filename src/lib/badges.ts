import { existsSync } from 'fs';
import { join } from 'path';
import { readJsonSafe, detectLicense } from '../utils/helpers.js';

interface PackageJson {
  name?: string;
  version?: string;
  engines?: { node?: string };
}

export interface Badge {
  label: string;
  markdown: string;
}

export function detectBadges(dir: string = '.'): Badge[] {
  const badges: Badge[] = [];
  const pkg = readJsonSafe<PackageJson>(join(dir, 'package.json'));

  // npm version
  if (pkg?.name) {
    badges.push({
      label: 'npm version',
      markdown: `[![npm version](https://img.shields.io/npm/v/${pkg.name})](https://www.npmjs.com/package/${pkg.name})`,
    });
  }

  // License
  const license = detectLicense(dir);
  if (license && license !== 'Custom') {
    const color = license === 'MIT' ? 'green' : license.startsWith('Apache') ? 'blue' : 'orange';
    badges.push({
      label: 'License',
      markdown: `[![License: ${license}](https://img.shields.io/badge/license-${encodeURIComponent(license)}-${color})](LICENSE)`,
    });
  }

  // TypeScript
  if (existsSync(join(dir, 'tsconfig.json'))) {
    badges.push({
      label: 'TypeScript',
      markdown: `[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)](https://www.typescriptlang.org/)`,
    });
  }

  // Node.js version
  if (pkg?.engines?.node) {
    const nodeVersion = pkg.engines.node.replace(/[>=<^~]/g, '');
    badges.push({
      label: 'Node.js',
      markdown: `[![Node.js](https://img.shields.io/badge/node-%3E%3D${nodeVersion}-339933)](https://nodejs.org/)`,
    });
  }

  // CI status (GitHub Actions)
  if (existsSync(join(dir, '.github/workflows'))) {
    // Try to detect repo name for CI badge
    const repoUrl = getRepoSlug(dir);
    if (repoUrl) {
      badges.push({
        label: 'CI',
        markdown: `[![CI](https://github.com/${repoUrl}/actions/workflows/ci.yml/badge.svg)](https://github.com/${repoUrl}/actions/workflows/ci.yml)`,
      });
    }
  }

  // Docker
  if (existsSync(join(dir, 'Dockerfile'))) {
    badges.push({
      label: 'Docker',
      markdown: `[![Docker](https://img.shields.io/badge/Docker-ready-2496ED)](https://www.docker.com/)`,
    });
  }

  // PRs Welcome
  badges.push({
    label: 'PRs Welcome',
    markdown: `[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/${getRepoSlug(dir) || 'owner/repo'}/pulls)`,
  });

  return badges;
}

function getRepoSlug(dir: string): string | null {
  try {
    const { execSync } = require('child_process');
    const url = execSync('git remote get-url origin', { cwd: dir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    // SSH: git@github.com:owner/repo.git
    const sshMatch = url.match(/git@github\.com:(.+?)(?:\.git)?$/);
    if (sshMatch) return sshMatch[1];
    // HTTPS: https://github.com/owner/repo.git
    const httpsMatch = url.match(/github\.com\/(.+?)(?:\.git)?$/);
    if (httpsMatch) return httpsMatch[1];
  } catch {
    // ignore
  }
  return null;
}

export function formatBadges(badges: Badge[]): string {
  return badges.map(b => b.markdown).join('\n');
}
