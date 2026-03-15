import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { detectBadges, formatBadges } from '../lib/badges.js';

export const badgeCommand = new Command('badge')
  .description('Auto-detect and add project badges to your README')
  .alias('badges')
  .option('-f, --file <path>', 'README file to update', 'README.md')
  .option('-d, --dir <path>', 'Project directory', '.')
  .option('--dry-run', 'Preview badges without modifying README')
  .action((options) => {
    const badges = detectBadges(options.dir);

    if (badges.length === 0) {
      console.log(chalk.yellow('\n  No badges detected for this project.\n'));
      process.exit(0);
    }

    console.log(chalk.bold(`\n  Detected ${badges.length} badges:\n`));
    for (const badge of badges) {
      console.log(chalk.gray(`  • ${badge.label}`));
    }

    const badgeMarkdown = formatBadges(badges);

    if (options.dryRun) {
      console.log(chalk.bold('\n  Badge markdown:\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(badgeMarkdown);
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.cyan('\n  Dry run — file not modified.\n'));
      return;
    }

    if (!existsSync(options.file)) {
      console.log(chalk.yellow(`\n  ${options.file} not found. Creating with badges only.\n`));
      writeFileSync(options.file, badgeMarkdown + '\n', 'utf-8');
      console.log(chalk.green(`  ✓ ${options.file} created with badges.\n`));
      return;
    }

    const content = readFileSync(options.file, 'utf-8');

    // Check if badges already exist
    if (content.includes('img.shields.io')) {
      console.log(chalk.yellow('\n  Badges already exist in README. Skipping to avoid duplicates.\n'));
      console.log(chalk.gray('  Tip: Remove existing badges and run again, or use --dry-run to see the output.\n'));
      return;
    }

    // Insert badges after first H1 heading
    const h1Match = content.match(/^# .+$/m);
    let updatedContent: string;

    if (h1Match && h1Match.index !== undefined) {
      const insertPos = h1Match.index + h1Match[0].length;
      updatedContent =
        content.slice(0, insertPos) +
        '\n\n' + badgeMarkdown + '\n' +
        content.slice(insertPos);
    } else {
      // No H1, prepend badges
      updatedContent = badgeMarkdown + '\n\n' + content;
    }

    writeFileSync(options.file, updatedContent, 'utf-8');
    console.log(chalk.green(`\n  ✓ ${badges.length} badges added to ${options.file}.\n`));
  });
