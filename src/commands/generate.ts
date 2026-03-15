import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { analyzeProject } from '../lib/analyzer.js';
import { generateReadme } from '../lib/ai.js';
import { isValidTemplate, type TemplateStyle } from '../lib/templates.js';

export const generateCommand = new Command('generate')
  .description('Analyze your project and generate a professional README.md')
  .alias('gen')
  .alias('g')
  .option('-t, --template <style>', 'Template style: minimal, standard, detailed', 'standard')
  .option('-o, --output <file>', 'Output file path', 'README.md')
  .option('--overwrite', 'Overwrite existing README')
  .option('--dry-run', 'Preview without writing file')
  .option('-d, --dir <path>', 'Project directory', '.')
  .action(async (options) => {
    const template = options.template as string;
    if (!isValidTemplate(template)) {
      console.error(chalk.red(`\n  Invalid template: "${template}". Use: minimal, standard, or detailed.\n`));
      process.exit(1);
    }

    // Check for existing README
    if (!options.overwrite && existsSync(options.output)) {
      const existing = readFileSync(options.output, 'utf-8');
      if (existing.length > 100) {
        console.log(chalk.yellow('\n  ⚠ README.md already exists. Use --overwrite to replace it.\n'));
        console.log(chalk.gray('  Tip: Use "readme-forge check" to analyze your existing README.\n'));
        process.exit(0);
      }
    }

    // Analyze project
    const analyzeSpinner = ora('Analyzing project...').start();
    let analysis;
    try {
      analysis = analyzeProject(options.dir);
      analyzeSpinner.succeed(
        `Analyzed: ${chalk.bold(analysis.name)} (${analysis.language}, ${analysis.frameworks.join(', ') || 'no framework'})`
      );
    } catch (err: unknown) {
      analyzeSpinner.fail('Failed to analyze project');
      console.error(chalk.red(`  ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
    }

    // Generate README with AI
    const genSpinner = ora(`Generating ${template} README with Claude...`).start();
    try {
      const readme = await generateReadme(analysis, template as TemplateStyle);
      genSpinner.succeed('README generated');

      if (options.dryRun) {
        console.log('\n' + chalk.gray('─'.repeat(60)));
        console.log(readme);
        console.log(chalk.gray('─'.repeat(60)) + '\n');
        console.log(chalk.cyan('  Dry run — file not written. Remove --dry-run to save.\n'));
      } else {
        writeFileSync(options.output, readme, 'utf-8');
        console.log(chalk.green(`\n  ✓ ${options.output} written successfully!\n`));

        const lines = readme.split('\n').length;
        const sections = (readme.match(/^## /gm) || []).length;
        console.log(chalk.gray(`  ${lines} lines, ${sections} sections, ${template} template\n`));
      }
    } catch (err: unknown) {
      genSpinner.fail('Failed to generate README');
      console.error(chalk.red(`\n  ${err instanceof Error ? err.message : String(err)}\n`));
      process.exit(1);
    }
  });
