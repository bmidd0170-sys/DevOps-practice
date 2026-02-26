# Git Branching Strategy

## Overview
This project follows a modified Git Flow branching strategy designed for continuous development and delivery of the Notes API application. This strategy provides structure for feature development, bug fixes, and releases while maintaining code stability.

## Team Branch Responsibilities

### Critical Branches for Team

### ✅ Production-Ready Code (`main`)
The `main` branch contains code that is **ready for production**. This is our stable, deployed codebase.

**Key Characteristics:**
- Only merged code from `release` branches or `hotfix` branches
- Always stable and deployable at any moment
- Tagged with semantic version numbers (v1.0.0, v1.1.0, v1.2.0, etc.)
- Requires pull request review before any merge
- Automatic CI/CD pipeline triggers production deployment
- No direct commits allowed - all changes must go through PR process
- Team members treat this branch with the highest respect

**When to use:** 
- Merging completed releases to production
- Creating hotfixes for critical production issues
- Code in main should be what users are currently running

---

### 🔄 Integration Work (`develop`)
The `develop` branch is our **integration and staging branch** where features come together for testing.

**Key Characteristics:**
- Base branch for all feature and bugfix development
- Should remain stable for QA and staging testing
- Automatically deployed to staging environment
- Merges from `feature/*`, `bugfix/*` branches
- Serves as source for release branch creation
- Pull request reviews required before merge
- All features integrate and test here before production release

**When to use:**
- Integration point for completed features
- Staging environment testing
- Source for release planning
- Automatically deployed to testing/staging environment

---

### 🚀 New Features (`feature/*`)
Feature branches are **where new functionality is developed** in isolation.

**Naming Convention:** `feature/short-description`
- Example: `feature/add-note-search`, `feature/user-authentication`, `feature/docker-setup`

**Key Characteristics:**
- Each feature gets its own branch
- Branched from `develop`, never from `main`
- One logical feature per branch (keep scope focused)
- Regular commits with clear, descriptive messages
- Pull request to `develop` when complete
- Team members work independently on features
- Branch is deleted after merging to develop

**Workflow:**
1. Create: `git checkout -b feature/my-feature develop`
2. Develop: Make commits on your feature branch
3. Push: `git push -u origin feature/my-feature`
4. Review: Create pull request to develop
5. Merge: Once approved, merge to develop
6. Clean: Delete feature branch

---

### 🚨 Emergency Fixes (`hotfix/*`)
Hotfix branches handle **critical production bugs** that need immediate fixing.

**Naming Convention:** `hotfix/issue-description`
- Example: `hotfix/database-connection-error`

**Key Characteristics:**
- **Used only for critical production issues** that cannot wait for normal release cycle
- Branched directly from `main` (not from develop)
- Fixed code goes directly to `main` for immediate production deployment
- Changes are then merged back to `develop` to keep them in sync
- Patch version number is incremented (v1.0.0 → v1.0.1)
- Must be tested quickly and deployed fast
- Require minimum one review but with expedited approval process

**Workflow:**
1. Create: `git checkout -b hotfix/critical-issue main`
2. Fix: Make minimal, focused commits
3. Test: Verify fix thoroughly before pushing
4. Push: `git push -u origin hotfix/critical-issue`
5. Review: Create pull request to main (fast-tracked review)
6. Deploy: Merge to main immediately after approval
7. Sync: Create PR from hotfix to develop
8. Tag: Version tag created on main
9. Clean: Delete hotfix branch

---

## Branch Structure Details

### Main Branches

#### 1. `main` (Production)

#### 2. `develop` (Development)
- **Purpose**: Integration branch for features
- **Source**: Merges from `feature`, `bugfix`, and `release` branches
- **Rules**:
  - Should be stable and ready for testing
  - All completed features merged here first
  - Continuous integration and testing required
  - Base branch for all feature branches
  - Automatically deployed to staging environment

### Supporting Branches

#### 3. Feature Branches (`feature/*`)
- **Naming Convention**: `feature/feature-name`
  - Example: `feature/add-note-search`, `feature/user-authentication`
- **Source**: Branch from `develop`
- **Purpose**: Develop new features or enhancements
- **Merging**: Create pull request to `develop`
- **Rules**:
  - One feature per branch
  - Regular commits with descriptive messages
  - Keep scope focused and atomic
  - Delete branch after merge
  - Naming pattern: `feature/short-description-kebab-case`

#### 4. Bugfix Branches (`bugfix/*`)
- **Naming Convention**: `bugfix/bug-description`
  - Example: `bugfix/fix-note-deletion-error`
- **Source**: Branch from `develop`
- **Purpose**: Fix non-critical bugs in development
- **Merging**: Create pull request to `develop`
- **Rules**:
  - For bugs found during development/testing
  - Include issue tracker reference if applicable
  - Delete branch after merge

#### 5. Release Branches (`release/*`)
- **Naming Convention**: `release/v{version}`
  - Example: `release/v1.1.0`
- **Source**: Branch from `develop`
- **Purpose**: Prepare and test releases
- **Merging**: 
  - Merge to `main` when ready for production
  - Merge back to `develop`
  - Tag on `main` with version number
- **Rules**:
  - No new features, only bug fixes and version updates
  - Update version numbers (package.json, tags)
  - Finalize release notes
  - Allow time for QA testing
  - Limited to critical fixes only

#### 6. Hotfix Branches (`hotfix/*`)
- **Naming Convention**: `hotfix/issue-description`
  - Example: `hotfix/database-connection-pool`
- **Source**: Branch from `main`
- **Purpose**: Fix critical production issues
- **Merging**:
  - Merge directly to `main`
  - Merge back to `develop`
  - Tag on `main` with patch version
- **Rules**:
  - For critical production bugs only
  - Minimal scope - only necessary fixes
  - Require immediate testing and deployment
  - Quick turnaround expected
  - Increment patch version number

## Workflow Examples

### Feature Development Workflow
```
1. Start from develop branch
2. Create feature branch: git checkout -b feature/add-search-functionality
3. Work on feature with regular commits
4. Push feature branch to remote
5. Create pull request to develop
6. Code review and CI/CD checks pass
7. Merge to develop
8. Delete feature branch
9. Feature is deployed to staging automatically
```

### Release Workflow
```
1. When develop is stable and ready for release
2. Create release branch: git checkout -b release/v1.2.0
3. Update version numbers
4. Fix any release-blocking bugs
5. Create pull request to main
6. Final QA testing
7. Merge to main and tag: git tag v1.2.0
8. Merge back to develop
9. Automatic deployment to production
```

### Hotfix Workflow
```
1. Critical production bug identified
2. Create hotfix branch: git checkout -b hotfix/fix-api-crash
3. Implement and test fix
4. Merge to main with pull request
5. Tag version: git tag v1.2.1 (patch bump)
6. Merge back to develop
7. Automatic deployment to production
```

## Commit Message Convention

Use descriptive commit messages following this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without feature/fix changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, or tooling changes

### Examples
```
feat(notes): add search functionality to notes API

fix(database): resolve connection pool exhaustion issue

docs(readme): update installation instructions

refactor(api): simplify error handling in note routes
```

## Pull Request Process

### Before Creating a PR
1. Ensure branch is up-to-date with base branch
2. Run tests locally: `npm run test`
3. Run linting: `npm run lint`
4. Build project: `npm run build`
5. Verify Docker builds successfully

### PR Requirements
- Descriptive title following commit conventions
- Detailed description of changes
- Reference to related issues (if applicable)
- Screenshots/demos for UI changes
- Updated documentation if needed
- All CI/CD checks passing
- At least one code review approval

### Code Review Checklist
- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] No breaking changes to API
- [ ] Performance impact assessed
- [ ] Security considerations reviewed

## Version Numbering

Use Semantic Versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Example progression: v1.0.0 → v1.1.0 → v1.1.1 → v2.0.0

## Protection Rules

### On `main` Branch
- Require pull request reviews (minimum 1)
- Require status checks to pass
- Dismiss stale pull request approvals
- Require branches to be up-to-date before merging
- Include administrators in restriction

### On `develop` Branch
- Require pull request reviews (minimum 1)
- Require status checks to pass
- Require branches to be up-to-date before merging

## CI/CD Integration

All pull requests automatically trigger:
- Build verification
- Unit tests
- Linting checks
- Docker image build
- Security scanning
- Type checking (TypeScript)

## Best Practices

1. **Keep branches short-lived**: Merge within 1-2 weeks
2. **Communicate early**: Share PRs for review early
3. **Test thoroughly**: Run local tests before pushing
4. **Keep history clean**: Use meaningful commit messages
5. **Review before merge**: Ensure code quality
6. **Document changes**: Update docs with feature changes
7. **Manage dependencies**: Update and test dependency changes
8. **Perform regular merges**: Sync feature branches with develop
9. **Delete merged branches**: Keep repository clean
10. **Tag releases**: Always tag version releases on main

## Tools & Commands Reference

```bash
# Create and switch to feature branch
git checkout -b feature/feature-name

# Push branch to remote
git push -u origin feature/feature-name

# Create pull request (GitHub CLI)
gh pr create --base develop

# Delete local branch
git branch -d feature/feature-name

# Delete remote branch
git push origin --delete feature/feature-name

# Sync with develop
git pull origin develop

# Rebase on develop (interactive, optional)
git rebase -i develop

# Tag a release
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin --tags
```

## Emergency Procedures

### Reverting a Merged PR
```bash
git revert <commit-hash>
git push origin main
```

### Fixing a Mistaken Commit
```bash
git reset --soft HEAD~1  # Undo last commit, keep changes
git commit                # Re-commit with correct message
```

### Emergency Rollback
1. Identify the last stable commit
2. Create hotfix from that point
3. Deploy hotfix to production
4. Investigate root cause in separate bugfix branch
