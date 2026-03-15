<div align="center">

# readme-forge

**AI-powered README generator. One command. Professional docs.**

[![npm](https://img.shields.io/npm/v/readme-forge)](https://www.npmjs.com/package/readme-forge)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)](https://www.typescriptlang.org/)
[![CI](https://github.com/scuton-technology/readme-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/scuton-technology/readme-forge/actions/workflows/ci.yml)

</div>

---

## Why?

Writing a good README is tedious. readme-forge analyzes your project — package.json, file structure, dependencies, git history — and generates a professional README in seconds using Claude AI.

## Install

```bash
npm install -g readme-forge
```

## Setup

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at [console.anthropic.com](https://console.anthropic.com/settings/keys)

## Usage

```bash
# Generate README for current project
readme-forge

# Choose template style
readme-forge generate --template minimal
readme-forge generate --template detailed

# Preview without writing
readme-forge generate --dry-run

# Check existing README quality
readme-forge check

# Add badges to README
readme-forge badge

# Generate table of contents
readme-forge toc
```

## Commands

| Command | Description | Needs API Key |
|---------|-------------|:---:|
| `readme-forge generate` | Generate README from project analysis | Yes |
| `readme-forge check` | Score your existing README (A+ to F) | No |
| `readme-forge badge` | Auto-detect and add project badges | No |
| `readme-forge toc` | Generate table of contents | No |

## Templates

**minimal** — Title, description, install, usage, license. Nothing more.

**standard** (default) — Badges, features, install, usage, contributing, license.

**detailed** — Everything + TOC, tech stack table, project structure, env vars, deployment.

## How it works

1. Scans your project: package.json, file structure, dependencies, git info
2. Detects language, framework, tools, CI/CD setup
3. Sends analysis to Claude (your API key, your data)
4. Returns clean Markdown — no fluff, no hallucination

Your code is NOT sent to the API. Only metadata (file names, package names, scripts) is sent.

## Privacy

- Your source code stays local. Only project metadata is sent to Anthropic's API.
- Your API key is used directly — we don't proxy or store anything.
- `check`, `badge`, and `toc` commands work 100% offline.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT — [Scuton Technology](https://scuton.com)

---

<div align="center">
<sub>Built with ❤️ by Scuton Technology</sub>
</div>
