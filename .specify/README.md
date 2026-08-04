# Spec-Kit Integration for CRELEALTAD CORE

This project uses [GitHub Spec-Kit](https://github.com/github/spec-kit) for Spec-Driven Development (SDD).

## What is Spec-Driven Development?

Spec-Driven Development flips the script on traditional software development. Instead of code being king, **specifications become executable** - directly generating working implementations rather than just guiding them.

## Available Skills

The following spec-kit skills are available as Claude Code commands:

### Core Workflow

1. **`/speckit-constitution`** - Create or update project constitution and governing principles
   - Use this first to establish project principles and development guidelines

2. **`/speckit-specify`** - Create feature specifications from natural language
   - Describe what you want to build (focus on WHAT and WHY, not HOW)
   - Automatically creates spec files in `specs/` directory
   - Example: `/speckit-specify Add user authentication with OAuth2 support`

3. **`/speckit-clarify`** - Clarify ambiguous requirements in specifications
   - Helps resolve unclear or conflicting requirements

4. **`/speckit-plan`** - Create technical implementation plans
   - Generates detailed technical plans from specifications
   - Creates architecture decisions and implementation steps

5. **`/speckit-tasks`** - Generate actionable development tasks
   - Breaks down plans into concrete, implementable tasks
   - Creates task files in the feature directory

6. **`/speckit-implement`** - Implement features based on tasks
   - Executes implementation following the defined tasks and plan

### Quality & Analysis

7. **`/speckit-analyze`** - Analyze specifications and implementation status
   - Review current state and identify gaps or issues

8. **`/speckit-checklist`** - Generate quality and requirement checklists
   - Creates validation checklists for features

9. **`/speckit-converge`** - Align specification with implementation
   - Ensures spec and code stay in sync

### Integration

10. **`/speckit-taskstoissues`** - Convert tasks to GitHub issues
    - Syncs spec-kit tasks with your GitHub project

## Directory Structure

```
CRELEALTAD CORE/
├── .specify/              # Spec-kit configuration
│   ├── init-options.json  # Project initialization options
│   ├── memory/           # Project memory and constitution
│   └── README.md         # This file
├── specs/                # Feature specifications
│   └── NNN-feature-name/ # Individual feature directories
│       ├── spec.md       # Feature specification
│       ├── plan.md       # Technical plan
│       ├── tasks.md      # Implementation tasks
│       └── checklists/   # Quality checklists
└── templates/            # Spec-kit templates
    ├── spec-template.md
    ├── plan-template.md
    ├── tasks-template.md
    └── commands/         # Command templates
```

## Typical Workflow

1. **Establish Principles** (once per project)
   ```
   /speckit-constitution Create principles focused on code quality, testing, and user experience
   ```

2. **Create Specification**
   ```
   /speckit-specify Add a loyalty points system where users earn points for purchases
   ```

3. **Clarify Requirements** (if needed)
   ```
   /speckit-clarify
   ```

4. **Generate Plan**
   ```
   /speckit-plan
   ```

5. **Create Tasks**
   ```
   /speckit-tasks
   ```

6. **Implement**
   ```
   /speckit-implement
   ```

7. **Analyze & Validate**
   ```
   /speckit-analyze
   /speckit-checklist
   ```

## Key Principles

- **Focus on WHAT and WHY** - Specifications should describe what users need and why, not how to implement it
- **Technology-Agnostic** - Keep specs free from implementation details (languages, frameworks, APIs)
- **Testable Requirements** - All requirements should be measurable and verifiable
- **Iterative Refinement** - Specs evolve through clarification and analysis

## Configuration

The project is configured with:
- **Integration**: Claude Code
- **Feature Numbering**: Sequential (001, 002, 003, ...)
- **Specs Directory**: `specs/`

## Learn More

- [Spec-Kit Documentation](https://github.github.io/spec-kit/)
- [Spec-Kit Repository](https://github.com/github/spec-kit)
- [Spec-Driven Development Philosophy](https://github.com/github/spec-kit/blob/main/spec-driven.md)

## Notes

This integration was installed from the spec-kit repository cloned at:
`.claude/skills/spec-kit/`

All skills are available as `/speckit-*` commands in Claude Code.
