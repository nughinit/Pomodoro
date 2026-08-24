# Pomodoro

Reconstruction of an earlier study project as a production-quality focus timer.

> Status: planning and foundations.

## Goal

Build an accessible, reliable and well-tested Pomodoro application while documenting the technical decisions behind it.

## Planned stack

- React
- TypeScript
- Vite
- Vitest and Testing Library
- ESLint and Prettier
- LocalStorage
- GitHub Actions

## Product scope

### MVP

- Focus, short-break and long-break sessions
- Start, pause, resume and reset controls
- Configurable durations
- Automatic session transitions
- Light and dark themes
- Responsive and keyboard-accessible interface
- Local persistence

### Portfolio-quality release

- Daily session history and goals
- Task labels
- Reliable background-tab timing
- Automated tests and continuous integration
- Architecture and accessibility documentation
- Public deployment

## Engineering principles

- Model the timer as explicit states and transitions
- Derive remaining time from a target timestamp
- Keep domain logic separate from presentation
- Validate persisted browser data
- Test behavior and risk, not implementation details
- Keep the interface usable with keyboard and assistive technology

## Roadmap

See [docs/project-plan.md](docs/project-plan.md).

## Privacy

This is an independent public portfolio project. It contains no private Intimatio source code, data or proprietary business material.
