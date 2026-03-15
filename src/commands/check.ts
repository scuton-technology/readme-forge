import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  suggestion?: string;
}

function checkReadme(content: string): CheckResult[] {
  const results: CheckResult[] = [];

  // 1. Title (h1)
  results.push({
    name: 'Title (H1 heading)',
    passed: /^# .+/m.test(content),
    suggestion: 'Add a title: # Project Name',
  });

  // 2. Description
  const lines = content.split('\n').filter(l => l.trim());
  const hasDescription = lines.some((line, i) => {
    if (i === 0) return false;
    return line.trim().length > 20 && !line.startsWith('#') && !line.startsWith('[') && !line.startsWith('|');
  });
  results.push({
    name: 'Description',
    passed: hasDescription,
    suggestion: 'Add a description paragraph after the title',
  });

  // 3. Install/Getting Started
  results.push({
    name: 'Installation section',
    passed: /##\s*(install|getting\s*started|setup|quick\s*start)/im.test(content),
    suggestion: 'Add an ## Installation or ## Getting Started section',
  });

  // 4. Usage
  results.push({
    name: 'Usage section',
    passed: /##\s*(usage|how\s*to\s*use|examples?)/im.test(content),
    suggestion: 'Add a ## Usage section with examples',
  });

  // 5. License
  results.push({
    name: 'License section',
    passed: /##\s*license/im.test(content) || /\blicense\b/im.test(content),
    suggestion: 'Add a ## License section',
  });

  // 6. Badges
  results.push({
    name: 'Badges',
    passed: /\[!\[.+\]\(.+\)\]\(.+\)/.test(content) || /!\[.+\]\(https:\/\/img\.shields\.io/.test(content),
    suggestion: 'Add badges — run `readme-forge badge` to auto-generate them',
  });

  // 7. Contributing
  results.push({
    name: 'Contributing section',
    passed: /##\s*contribut/im.test(content),
    suggestion: 'Add a ## Contributing section or link to CONTRIBUTING.md',
  });

  // 8. Code blocks
  results.push({
    name: 'Code examples',
    passed: /```[\s\S]*?```/.test(content),
    suggestion: 'Add code examples in fenced code blocks (```)',
  });

  // 9. Links
  results.push({
    name: 'Links',
    passed: /\[.+\]\(http/.test(content) || /\[.+\]\(.+\..+\)/.test(content),
    suggestion: 'Add links to relevant resources, docs, or demos',
  });

  // 10. Length
  results.push({
    name: 'Sufficient length (50+ lines)',
    passed: content.split('\n').length >= 50,
    suggestion: 'Your README is too short. Add more content for better documentation',
  });

  return results;
}

function getGrade(score: number): { grade: string; color: (s: string) => string } {
  if (score === 10) return { grade: 'A+', color: chalk.green };
  if (score >= 8) return { grade: 'A', color: chalk.green };
  if (score >= 6) return { grade: 'B', color: chalk.yellow };
  if (score >= 4) return { grade: 'C', color: chalk.yellow };
  if (score >= 2) return { grade: 'D', color: chalk.red };
  return { grade: 'F', color: chalk.red };
}

export const checkCommand = new Command('check')
  .description('Check the quality of your existing README.md')
  .option('-f, --file <path>', 'README file to check', 'README.md')
  .action((options) => {
    const filePath = options.file;

    if (!existsSync(filePath)) {
      console.error(chalk.red(`\n  ${filePath} not found. Run "readme-forge generate" to create one.\n`));
      process.exit(1);
    }

    const content = readFileSync(filePath, 'utf-8');
    if (content.trim().length === 0) {
      console.error(chalk.red(`\n  ${filePath} is empty. Run "readme-forge generate" to create one.\n`));
      process.exit(1);
    }

    console.log(chalk.bold(`\n  README Quality Check: ${filePath}\n`));

    const results = checkReadme(content);
    const score = results.filter(r => r.passed).length;
    const { grade, color } = getGrade(score);

    for (const result of results) {
      const icon = result.passed ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${icon} ${result.name}`);
      if (!result.passed && result.suggestion) {
        console.log(chalk.gray(`    → ${result.suggestion}`));
      }
    }

    console.log(`\n  Score: ${color(`${score}/10 (${grade})`)}\n`);

    if (score < 10) {
      console.log(chalk.gray('  Tip: Run "readme-forge generate --overwrite" to regenerate your README.\n'));
    }
  });
