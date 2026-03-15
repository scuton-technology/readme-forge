import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const TOC_START = '<!-- toc -->';
const TOC_END = '<!-- /toc -->';

interface Heading {
  level: number;
  text: string;
  anchor: string;
}

function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();

    // Skip TOC itself
    if (text.toLowerCase() === 'table of contents') continue;

    const anchor = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    headings.push({ level, text, anchor });
  }

  return headings;
}

function buildToc(headings: Heading[]): string {
  const lines = headings.map(h => {
    const indent = h.level === 3 ? '  ' : '';
    return `${indent}- [${h.text}](#${h.anchor})`;
  });

  return `${TOC_START}\n## Table of Contents\n\n${lines.join('\n')}\n${TOC_END}`;
}

export const tocCommand = new Command('toc')
  .description('Generate or update table of contents in your README')
  .option('-f, --file <path>', 'README file to update', 'README.md')
  .option('--dry-run', 'Preview TOC without modifying README')
  .action((options) => {
    if (!existsSync(options.file)) {
      console.error(chalk.red(`\n  ${options.file} not found. Create a README first.\n`));
      process.exit(1);
    }

    const content = readFileSync(options.file, 'utf-8');
    const headings = extractHeadings(content);

    if (headings.length === 0) {
      console.log(chalk.yellow('\n  No headings (## or ###) found in README.\n'));
      process.exit(0);
    }

    const toc = buildToc(headings);

    console.log(chalk.bold(`\n  Found ${headings.length} headings:\n`));
    for (const h of headings) {
      const indent = h.level === 3 ? '    ' : '  ';
      console.log(chalk.gray(`${indent}${h.text}`));
    }

    if (options.dryRun) {
      console.log(chalk.bold('\n  Generated TOC:\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(toc);
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.cyan('\n  Dry run — file not modified.\n'));
      return;
    }

    let updatedContent: string;

    // Replace existing TOC
    const tocRegex = new RegExp(`${escapeRegex(TOC_START)}[\\s\\S]*?${escapeRegex(TOC_END)}`, 'm');
    if (tocRegex.test(content)) {
      updatedContent = content.replace(tocRegex, toc);
      console.log(chalk.green('\n  ✓ Table of contents updated.\n'));
    } else {
      // Insert before first ## heading
      const firstH2 = content.match(/^## /m);
      if (firstH2 && firstH2.index !== undefined) {
        updatedContent =
          content.slice(0, firstH2.index) +
          toc + '\n\n' +
          content.slice(firstH2.index);
      } else {
        updatedContent = content + '\n\n' + toc;
      }
      console.log(chalk.green('\n  ✓ Table of contents added.\n'));
    }

    writeFileSync(options.file, updatedContent, 'utf-8');
  });

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
