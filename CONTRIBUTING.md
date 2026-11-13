# Contributing Guide

## Welcome! 👋

Thank you for considering contributing to the Mwazanga Hardware POS system! This document provides guidelines and instructions for contributing.

---

## Code of Conduct

- Be respectful and inclusive
- Constructive feedback only
- No harassment or discrimination
- Report violations to maintainers

---

## How to Contribute

### 1. Reporting Bugs

**Before opening an issue:**
- Check if bug already exists
- Test with latest version
- Gather reproduction steps

**When reporting:**

```
Title: [Bug] Brief description

Environment:
- OS: [e.g., Windows 11, macOS 14]
- Node version: [e.g., 18.x]
- npm version: [e.g., 9.x]

Steps to reproduce:
1. 
2. 
3. 

Expected behavior:
[Describe what should happen]

Actual behavior:
[Describe what actually happens]

Screenshots/Logs:
[If applicable]
```

### 2. Suggesting Features

**When suggesting:**

```
Title: [Feature] Brief description

Problem:
[Explain the problem this solves]

Proposed Solution:
[Describe your idea]

Alternatives:
[Describe alternatives considered]

Examples:
[Show how it would be used]
```

### 3. Pull Requests

**Before submitting:**
- Fork the repository
- Create feature branch: `git checkout -b feature/amazing-feature`
- Make changes
- Commit with descriptive messages
- Push to fork
- Open PR with description

**PR Requirements:**
- Clear title and description
- References related issue(s)
- Tests for new features
- No breaking changes (unless documented)
- Updated documentation

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/pos.git
cd pos

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/pos.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Make Changes

Edit files as needed for your feature.

### 6. Test Your Changes

```bash
# Run linting
npm run lint

# Run tests (when available)
npm test

# Build to check for errors
npm run build
```

### 7. Commit Changes

```bash
# Add files
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"
```

### 8. Keep Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase on main
git rebase upstream/main

# Force push if needed
git push --force-with-lease origin feature/your-feature-name
```

### 9. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create PR on GitHub.

---

## Coding Standards

### TypeScript

- Use strict mode
- Type all function parameters
- Use interfaces for objects
- Avoid `any` type

```typescript
// ✅ Good
interface Product {
  id: string
  name: string
  price: number
}

function addProduct(product: Product): void {
  // Implementation
}

// ❌ Avoid
function addProduct(product: any): void {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Use `forwardRef` for wrapper components
- Set `displayName` for debugging
- Prop types via TypeScript interfaces

```typescript
// ✅ Good
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', ...props }, ref) => (
    <button ref={ref} className={`btn btn-${variant}`} {...props} />
  )
)

Button.displayName = 'Button'

// ❌ Avoid
const Button = (props) => <button {...props} />
```

### File Naming

```
Components:     MyComponent.tsx (PascalCase)
Pages:          page.tsx
Utilities:      formatUtils.ts (camelCase)
Types:          index.ts
Constants:      CONSTANTS.ts (UPPER_CASE)
Tests:          component.test.tsx
```

### CSS/Styling

- Use Tailwind CSS utilities
- Use existing color variables
- Group related utilities
- Use responsive breakpoints

```tsx
// ✅ Good
<div className="flex items-center gap-4 p-4 rounded-lg bg-ceramic-primary text-white hover:bg-ceramic-dark transition-colors">
  Content
</div>

// ❌ Avoid
<div style={{ display: 'flex', color: 'red', padding: '16px' }}>
  Content
</div>
```

### Comments and Documentation

```typescript
/**
 * Formats a number as currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}
```

---

## Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **style**: Code style (formatting, missing semicolons, etc)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding tests
- **chore**: Build process, dependencies

### Examples

```bash
# Good
git commit -m "feat(cart): add item quantity update"
git commit -m "fix(dashboard): correct total calculation"
git commit -m "docs: update API integration guide"

# Avoid
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "asdf"
```

---

## Adding a New Feature

### Step 1: Plan

- Create issue describing feature
- Discuss approach with maintainers
- Get approval before starting

### Step 2: Create Types

```typescript
// types/index.ts
export interface NewFeature {
  id: string
  name: string
  // ... properties
}
```

### Step 3: Build Components

```typescript
// components/NewFeature.tsx
export const NewFeature: React.FC<NewFeatureProps> = (props) => {
  return <div>{/* Component JSX */}</div>
}
```

### Step 4: Add to Store (if needed)

```typescript
// store/index.ts
// Add new domain to Zustand store
```

### Step 5: Create Page/Module

```typescript
// app/newmodule/page.tsx
export default function NewModulePage() {
  return <MainLayout>{/* Page content */}</MainLayout>
}
```

### Step 6: Update Navigation

```typescript
// components/layouts/sidebar.tsx
// Add navigation item
```

### Step 7: Write Tests

```typescript
// components/__tests__/NewFeature.test.tsx
describe('NewFeature', () => {
  // Tests
})
```

### Step 8: Update Documentation

- Update README if necessary
- Update DEVELOPMENT.md with examples
- Add comments in code

### Step 9: Create PR

- Clear description
- Reference issue
- Include screenshot if UI change
- Link related PRs

---

## Code Review Process

### When Reviewing

- Be constructive and respectful
- Suggest improvements, don't demand
- Acknowledge good work
- Ask questions for clarification
- Approve when satisfied

### When Reviewed

- Respond to feedback promptly
- Ask for clarification if needed
- Make requested changes
- Mark conversations as resolved
- Request re-review after changes

---

## Testing Requirements

### For New Features

- Add unit tests for components
- Add unit tests for utilities
- Add integration tests for flows
- Aim for 80%+ coverage

### Before Submitting PR

```bash
# Run all checks
npm run lint
npm test
npm run build

# Test specific file
npm test NewFeature.test.tsx
```

---

## Documentation Requirements

### When Adding Features

- Update relevant markdown files
- Add code examples
- Document new components
- Update type definitions
- Add JSDoc comments

### PR Description

Include:
- What changed
- Why it changed
- How to test
- Screenshots (if UI)
- Related issues

---

## Project Structure

When adding features, follow the structure:

```
Feature Name
├── Component (components/)
├── Hook (hooks/)
├── Type (types/)
├── Utility (utils/)
├── Test (__tests__/)
├── Page (app/)
└── Documentation (README.md)
```

---

## Performance Guidelines

### When Contributing

- ✅ Use React.memo for expensive components
- ✅ Memoize callbacks with useCallback
- ✅ Lazy load heavy components
- ✅ Optimize images
- ✅ Split large files

- ❌ Don't create inline functions
- ❌ Don't re-fetch data on every render
- ❌ Don't use large bundles
- ❌ Don't forget key props in lists
- ❌ Don't abuse useEffect

---

## Accessibility Guidelines

All contributions must support:
- Keyboard navigation (Tab, Enter, Escape)
- Screen readers (semantic HTML, ARIA)
- Color contrast (WCAG AA minimum)
- Focus indicators (visible)
- Alternative text (images, icons)

### Test Accessibility

```bash
# Use axe DevTools browser extension
# Test keyboard navigation manually
# Test with screen reader (NVDA, VoiceOver)
```

---

## Branch Naming

```
feature/feature-name          # New features
fix/bug-description           # Bug fixes
docs/what-to-document         # Documentation
refactor/what-to-refactor     # Code improvements
perf/performance-improvement  # Performance work
test/test-description         # Test additions
```

---

## Labels (Issues & PRs)

- `bug`: Something isn't working
- `enhancement`: New feature request
- `documentation`: Improve docs
- `good first issue`: Good for newcomers
- `help wanted`: Need assistance
- `in progress`: Currently being worked on
- `review needed`: Needs code review
- `blocked`: Waiting on something

---

## Release Process

When maintainers prepare a release:

1. Update version in package.json
2. Update CHANGELOG.md
3. Tag commit: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Create GitHub release
6. Deploy to production

---

## Communication

### Discussion Channels

- **GitHub Discussions**: Feature ideas, questions
- **GitHub Issues**: Bugs, feature requests
- **Pull Requests**: Code review, implementation
- **Email**: Contact maintainers (if provided)

---

## Getting Help

- Check existing documentation
- Search closed issues
- Ask in discussions
- Comment on related PR
- Email maintainers

---

## Recognition

All contributors are:
- Added to CONTRIBUTORS.md
- Credited in releases
- Recognized in README

---

## License

By contributing, you agree your code is licensed under the project's license (typically MIT).

---

## Common Contribution Types

### Bug Fix

```bash
git checkout -b fix/issue-description
# Make changes
npm run lint
npm test
git commit -m "fix(component): description"
# Create PR
```

### Feature

```bash
git checkout -b feature/feature-name
# Create types, component, tests, docs
npm run build
npm test
npm run lint
git commit -m "feat(module): description"
# Create PR
```

### Documentation

```bash
git checkout -b docs/what-to-document
# Update markdown files
# Add examples
# Improve clarity
git commit -m "docs: description"
# Create PR
```

---

## Troubleshooting

### Issues with Setup

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Reset to main
git reset --hard upstream/main
```

### Merge Conflicts

```bash
# Before push
git fetch upstream
git rebase upstream/main

# Resolve conflicts in editor
git add .
git rebase --continue
git push --force-with-lease
```

### Test Failures

```bash
# Run specific test with details
npm test -- --verbose ComponentName.test.tsx

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## Questions?

- Check README.md
- Read DEVELOPMENT.md
- Open a Discussion
- Create an Issue
- Email maintainers

---

Thank you for contributing! 🎉

Your efforts make this project better for everyone.
