export type TemplateStyle = 'minimal' | 'standard' | 'detailed';

export const TEMPLATE_DESCRIPTIONS: Record<TemplateStyle, string> = {
  minimal: 'Title, description, install, usage, license. Nothing more.',
  standard: 'Badges, features, install, usage, contributing, license.',
  detailed: 'Everything + TOC, tech stack table, project structure, env vars, deployment.',
};

export function getTemplateSections(style: TemplateStyle): string[] {
  switch (style) {
    case 'minimal':
      return ['title', 'description', 'install', 'usage', 'license'];
    case 'standard':
      return ['title', 'badges', 'description', 'features', 'install', 'usage', 'api', 'contributing', 'license'];
    case 'detailed':
      return [
        'title', 'badges', 'toc', 'description', 'screenshots',
        'features', 'tech-stack', 'install', 'usage', 'project-structure',
        'env-vars', 'api', 'deployment', 'contributing', 'faq', 'credits', 'license',
      ];
  }
}

export function isValidTemplate(value: string): value is TemplateStyle {
  return ['minimal', 'standard', 'detailed'].includes(value);
}
