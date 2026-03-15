import Anthropic from '@anthropic-ai/sdk';
import type { ProjectAnalysis } from './analyzer.js';

export function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is required.\n\n' +
      'Get your API key at: https://console.anthropic.com/settings/keys\n' +
      'Then set it:\n' +
      '  export ANTHROPIC_API_KEY=sk-ant-...\n'
    );
  }
  return new Anthropic({ apiKey });
}

export async function generateReadme(
  analysis: ProjectAnalysis,
  template: 'minimal' | 'standard' | 'detailed' = 'standard'
): Promise<string> {
  const client = getClient();

  const systemPrompt = `You are a README.md generator. You create professional, clean, well-structured README files for open-source projects.

Rules:
- Output ONLY valid Markdown. No preamble, no explanation, no code fences wrapping the entire output.
- Use the project analysis data to generate accurate content.
- Include only sections that are relevant to the project.
- Badge URLs should use shields.io format.
- Install commands should match the detected package manager.
- If Docker support exists, include Docker setup instructions.
- If CI/CD exists, mention it.
- Keep it concise but complete. No filler text.
- Use the ${template} template style:
  - minimal: Title, description, install, usage, license. That's it.
  - standard: Title, badges, description, features, install, usage, API (if applicable), contributing, license.
  - detailed: Everything in standard + table of contents, screenshots placeholder, tech stack table, project structure, environment variables, deployment, FAQ, credits.`;

  const userPrompt = `Generate a README.md for this project:

Project Name: ${analysis.name}
Description: ${analysis.description}
Language: ${analysis.language}
Package Manager: ${analysis.packageManager}
Frameworks: ${analysis.frameworks.join(', ') || 'None detected'}
License: ${analysis.license || 'Not specified'}
Repository: ${analysis.repoUrl || 'Not detected'}
Has Docker: ${analysis.hasDocker}
Has CI/CD: ${analysis.hasCI}

Scripts:
${Object.entries(analysis.scripts).map(([k, v]) => `  ${k}: ${v}`).join('\n') || '  (none)'}

Dependencies: ${analysis.dependencies.slice(0, 20).join(', ') || '(none)'}
Dev Dependencies: ${analysis.devDependencies.slice(0, 10).join(', ') || '(none)'}

File Structure:
${analysis.fileTree || '(empty)'}

${analysis.entryPointPreview ? `Entry Point Preview:\n${analysis.entryPointPreview}` : ''}
${analysis.envVars.length > 0 ? `Environment Variables: ${analysis.envVars.join(', ')}` : ''}
${analysis.recentCommits.length > 0 ? `Recent Commits:\n${analysis.recentCommits.join('\n')}` : ''}

Template style: ${template}

Generate the README.md now:`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  return text;
}

export async function checkReadmeWithAI(
  readme: string,
  analysis: ProjectAnalysis
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: 'You are a README quality reviewer. Analyze the README against the project data and give actionable suggestions. Be concise.',
    messages: [{
      role: 'user',
      content: `Review this README for the project "${analysis.name}":\n\n${readme}\n\nProject has: ${analysis.frameworks.join(', ')} | ${analysis.language} | Docker: ${analysis.hasDocker} | CI: ${analysis.hasCI}\n\nGive 3-5 specific improvement suggestions.`,
    }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');
}
