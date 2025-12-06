# Contributing to Better Notion MCP

Thank you for your interest in contributing to Better Notion MCP! This guide will help you get started.

## Getting Started

### Prerequisites

- **Node.js 22+** and **pnpm** (we recommend using [mise](https://mise.jdx.dev/))
- Git
- A GitHub account

### Setup Development Environment

1. **Fork the repository** and clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/better-notion-mcp
cd better-notion-mcp
```

2. **Install mise (recommended)**

```bash
curl https://mise.run | sh
mise trust && mise install
```

3. **Install dependencies**

```bash
pnpm install
```

4. **Build the project**

```bash
mise run build
```

5. **Run tests**

```bash
mise run test
```

## Development Workflow

### Running Locally

```bash
# Set your Notion token
export NOTION_TOKEN=secret_xxx

# Start development server with auto-reload
mise run dev
```

### Making Changes

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run checks: `mise run check`
4. Run tests: `mise run test`
5. Build the project: `mise run build`
6. **Create a changeset**: `mise run changeset`
7. Commit your changes (see [Commit Convention](#commit-convention))
8. Push to your fork: `git push origin feature/your-feature-name`
9. Open a Pull Request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) with automated enforcement via commitlint and git hooks:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```text
feat: add bulk delete operation for pages
fix: handle pagination errors gracefully
docs: update API examples in README
test: add integration tests for databases tool
chore: upgrade dependencies
```

**Note**: Commit messages are validated automatically via git hooks when you commit.

## Changesets Workflow

We use [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

### When to Create a Changeset

Create a changeset for any user-facing changes:

- New features
- Bug fixes
- Breaking changes
- Deprecations

### How to Create a Changeset

```bash
mise run changeset
```

This will prompt you to:

1. Select packages to version (select `@n24q02m/better-notion-mcp`)
2. Choose version bump type:
   - **patch**: Bug fixes, minor changes
   - **minor**: New features, backwards-compatible
   - **major**: Breaking changes
3. Write a summary of your changes

The changeset will be saved in `.changeset/` directory and should be committed with your PR.

### Example Changeset

```markdown
---
"@n24q02m/better-notion-mcp": minor
---

Add bulk archive operation for pages, allowing multiple pages to be archived in a single API call
```

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Add tests for new functionality
- Ensure all checks pass (`pnpm check`)
- Include a changeset for user-facing changes
- Follow existing code style
- Write clear PR descriptions

### PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows TypeScript best practices
- [ ] All tests pass (`mise run test`)
- [ ] Linting passes (`mise run lint`)
- [ ] Formatting is correct (`mise run format:check`)
- [ ] Type checking passes (`mise run type-check`)
- [ ] Changeset created (`mise run changeset`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow convention

## Code Style

- Use TypeScript strict mode
- Follow existing patterns in the codebase
- Write clear, descriptive variable names
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful type annotations

## Testing

```bash
# Run all tests
mise run test

# Run tests in watch mode
mise run test:watch

# Run tests with coverage
mise run test:coverage
```

### Writing Tests

- Place tests in `tests/` directory
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies appropriately

## Project Structure

```text
better-notion-mcp/
├── src/                    # Source code
│   ├── init-server.ts     # Server initialization
│   └── tools/             # Tool implementations
│       ├── registry.ts    # Tool registry
│       ├── composite/     # Composite tools
│       └── helpers/       # Helper utilities
├── scripts/               # Build scripts
├── tests/                 # Test files
├── .changeset/           # Changesets directory
└── build/                # Built output
```

## Release Process

Releases are automated via GitHub Actions and Changesets:

1. Developer creates PR with changes + changeset
2. PR is merged to `main`
3. Changesets action creates a "Version Packages" PR
4. Maintainer reviews and merges the version PR
5. Packages are automatically published to npm
6. Docker images are built and pushed

You don't need to worry about versioning - just create good changesets!

## Questions or Issues?

Feel free to open an issue for:

- Bug reports
- Feature requests
- Questions about the codebase
- Discussion about architecture

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Better Notion MCP! 🎉**
