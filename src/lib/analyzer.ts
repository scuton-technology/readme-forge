import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, relative, extname } from 'path';
import ignore, { type Ignore } from 'ignore';
import {
  readFileSafe,
  readJsonSafe,
  getGitRemoteUrl,
  getRecentCommits,
  readFirstNLines,
  detectLicense,
} from '../utils/helpers.js';

export interface ProjectAnalysis {
  name: string;
  description: string;
  language: 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'other';
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo' | 'go' | 'unknown';
  scripts: Record<string, string>;
  dependencies: string[];
  devDependencies: string[];
  hasDocker: boolean;
  hasCI: boolean;
  license: string | null;
  repoUrl: string | null;
  fileTree: string;
  entryPointPreview: string | null;
  envVars: string[];
  recentCommits: string[];
  existingReadme: string | null;
  frameworks: string[];
}

interface PackageJson {
  name?: string;
  description?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: { node?: string };
}

const FRAMEWORK_MAP: Record<string, string> = {
  'next': 'Next.js',
  'react': 'React',
  'react-dom': 'React',
  'vue': 'Vue.js',
  'svelte': 'Svelte',
  '@sveltejs/kit': 'SvelteKit',
  'express': 'Express',
  'fastify': 'Fastify',
  'koa': 'Koa',
  'hapi': 'Hapi',
  '@nestjs/core': 'NestJS',
  'tailwindcss': 'Tailwind CSS',
  'prisma': 'Prisma',
  '@prisma/client': 'Prisma',
  'drizzle-orm': 'Drizzle',
  'mongoose': 'Mongoose',
  'typeorm': 'TypeORM',
  'sequelize': 'Sequelize',
  'commander': 'Commander.js',
  'yargs': 'Yargs',
  'electron': 'Electron',
  'vite': 'Vite',
  'webpack': 'webpack',
  'esbuild': 'esbuild',
  'tsup': 'tsup',
  'jest': 'Jest',
  'vitest': 'Vitest',
  'mocha': 'Mocha',
  'socket.io': 'Socket.IO',
  'graphql': 'GraphQL',
  '@apollo/server': 'Apollo',
  'three': 'Three.js',
  'd3': 'D3.js',
};

function detectLanguage(dir: string, pkg: PackageJson | null): ProjectAnalysis['language'] {
  if (existsSync(join(dir, 'tsconfig.json'))) return 'typescript';
  if (existsSync(join(dir, 'Cargo.toml'))) return 'rust';
  if (existsSync(join(dir, 'go.mod'))) return 'go';
  if (existsSync(join(dir, 'requirements.txt')) || existsSync(join(dir, 'pyproject.toml')) || existsSync(join(dir, 'setup.py'))) return 'python';
  if (pkg) return 'javascript';
  return 'other';
}

function detectPackageManager(dir: string): ProjectAnalysis['packageManager'] {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(dir, 'package-lock.json')) || existsSync(join(dir, 'package.json'))) return 'npm';
  if (existsSync(join(dir, 'requirements.txt')) || existsSync(join(dir, 'Pipfile'))) return 'pip';
  if (existsSync(join(dir, 'Cargo.toml'))) return 'cargo';
  if (existsSync(join(dir, 'go.mod'))) return 'go';
  return 'unknown';
}

function detectFrameworks(deps: string[]): string[] {
  const frameworks: string[] = [];
  const seen = new Set<string>();
  for (const dep of deps) {
    const name = FRAMEWORK_MAP[dep];
    if (name && !seen.has(name)) {
      seen.add(name);
      frameworks.push(name);
    }
  }
  return frameworks;
}

function buildFileTree(dir: string, ig: Ignore, maxDepth: number = 3, maxFiles: number = 50): string {
  let fileCount = 0;

  function walk(currentDir: string, depth: number, prefix: string): string {
    if (depth > maxDepth || fileCount >= maxFiles) return '';

    let entries: string[];
    try {
      entries = readdirSync(currentDir).sort((a, b) => {
        const aIsDir = statSync(join(currentDir, a)).isDirectory();
        const bIsDir = statSync(join(currentDir, b)).isDirectory();
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
      });
    } catch {
      return '';
    }

    let result = '';
    const filteredEntries = entries.filter(entry => {
      const rel = relative(dir, join(currentDir, entry));
      const relForIgnore = rel.replace(/\\/g, '/');
      try {
        return !ig.ignores(relForIgnore) && !ig.ignores(relForIgnore + '/');
      } catch {
        return true;
      }
    });

    for (let i = 0; i < filteredEntries.length; i++) {
      if (fileCount >= maxFiles) {
        result += `${prefix}... (truncated)\n`;
        break;
      }

      const entry = filteredEntries[i];
      const fullPath = join(currentDir, entry);
      const isLast = i === filteredEntries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';

      let isDir = false;
      try {
        isDir = statSync(fullPath).isDirectory();
      } catch {
        continue;
      }

      fileCount++;
      result += `${prefix}${connector}${entry}${isDir ? '/' : ''}\n`;

      if (isDir) {
        result += walk(fullPath, depth + 1, prefix + childPrefix);
      }
    }

    return result;
  }

  return walk(dir, 0, '');
}

function findEntryPoint(dir: string): string | null {
  const candidates = [
    'src/index.ts',
    'src/index.js',
    'src/main.ts',
    'src/main.js',
    'src/app.ts',
    'src/app.js',
    'index.ts',
    'index.js',
    'main.ts',
    'main.js',
    'app.ts',
    'app.js',
    'lib/index.ts',
    'lib/index.js',
  ];

  for (const candidate of candidates) {
    const fullPath = join(dir, candidate);
    if (existsSync(fullPath)) {
      return readFirstNLines(fullPath, 50);
    }
  }
  return null;
}

function parseEnvExample(dir: string): string[] {
  const content = readFileSafe(join(dir, '.env.example'));
  if (!content) return [];
  return content
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.split('=')[0].trim())
    .filter(Boolean);
}

export function analyzeProject(dir: string = '.'): ProjectAnalysis {
  const pkg = readJsonSafe<PackageJson>(join(dir, 'package.json'));

  // Build ignore filter
  const ig = ignore();
  const gitignoreContent = readFileSafe(join(dir, '.gitignore'));
  if (gitignoreContent) {
    ig.add(gitignoreContent);
  }
  ig.add(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '*.lock', '.turbo', '.vercel', '.output']);

  const allDeps = [
    ...Object.keys(pkg?.dependencies ?? {}),
    ...Object.keys(pkg?.devDependencies ?? {}),
  ];

  const language = detectLanguage(dir, pkg);
  const packageManager = detectPackageManager(dir);

  return {
    name: pkg?.name ?? dir.split('/').pop() ?? dir.split('\\').pop() ?? 'unknown',
    description: pkg?.description ?? '',
    language,
    packageManager,
    scripts: pkg?.scripts ?? {},
    dependencies: Object.keys(pkg?.dependencies ?? {}),
    devDependencies: Object.keys(pkg?.devDependencies ?? {}),
    hasDocker: existsSync(join(dir, 'Dockerfile')) || existsSync(join(dir, 'docker-compose.yml')) || existsSync(join(dir, 'docker-compose.yaml')),
    hasCI: existsSync(join(dir, '.github/workflows')),
    license: detectLicense(dir),
    repoUrl: getGitRemoteUrl(dir),
    fileTree: buildFileTree(dir, ig),
    entryPointPreview: findEntryPoint(dir),
    envVars: parseEnvExample(dir),
    recentCommits: getRecentCommits(dir),
    existingReadme: readFileSafe(join(dir, 'README.md')),
    frameworks: detectFrameworks(allDeps),
  };
}
