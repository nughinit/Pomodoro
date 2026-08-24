# Pomodoro — Project Plan

## Project objective

Rebuild the original Pomodoro study project as a professional front-end portfolio application, using each milestone to review theory and apply it immediately.

## Learning workflow

Each milestone follows three layers:

1. **Theory** — review the relevant concepts.
2. **Implementation** — apply them to the product.
3. **Professional quality** — document decisions, tests and trade-offs.

## Milestone 1 — Product definition

### Review
- Product problem and target user
- MVP and scope control
- User stories
- Acceptance criteria
- Interface states

### Build
- Define focus, short-break and long-break flows
- Write user stories and acceptance criteria
- Establish the MVP boundary
- Record explicit non-goals

### Done when
- Core flow is documented
- MVP and future scope are separated
- Each core action has acceptance criteria

## Milestone 2 — Semantic HTML and accessibility

### Review
- Semantic HTML
- Buttons, links, forms and labels
- Keyboard focus
- ARIA and live regions
- Contrast and reduced motion

### Build
- Accessible timer structure
- Start, pause, resume and reset controls
- Session selector and settings form
- Keyboard interaction

### Done when
- Core flow works without a mouse
- Controls have accessible names
- Timer changes are communicated appropriately

## Milestone 3 — Responsive visual system

### Review
- Box model
- Flexbox and Grid
- Responsive layout
- CSS custom properties
- Interaction states

### Build
- Mobile and desktop layouts
- Light and dark themes
- Design tokens
- Running, paused and completed states

### Done when
- Layout works at common viewport sizes
- Color and spacing rules are consistent
- Focus, hover and disabled states are visible

## Milestone 4 — React architecture

### Review
- Components and composition
- Props and state
- Events and unidirectional data flow
- Custom hooks
- Separation of concerns

### Build
- Timer
- TimerControls
- SessionSelector
- ProgressIndicator
- Settings
- DailySummary

### Done when
- Domain rules are separated from presentation
- Components have clear responsibilities
- State is located at the lowest useful level

## Milestone 5 — TypeScript domain model

### Review
- Interfaces and type aliases
- Discriminated unions
- Optional data
- Pure functions
- Runtime validation boundaries

### Build
- TimerStatus
- SessionType
- TimerSettings
- CompletedSession
- PersistedAppState

### Done when
- No unexplained any types exist
- Invalid state combinations are difficult to represent
- External and persisted data are validated

## Milestone 6 — Reliable timer engine

### Review
- State machines
- Effects and cleanup
- Closures
- Browser timers
- Background-tab throttling

### Build
- Explicit timer states and transitions
- Target-timestamp calculation
- Pause and resume calculations
- Session completion and transition rules

### Done when
- Timer remains accurate after backgrounding the tab
- Intervals are cleaned up
- Transition rules are independently testable

## Milestone 7 — Persistence and history

### Review
- LocalStorage
- Serialization
- Schema versioning
- Recovery from corrupt data

### Build
- Persist settings
- Restore interrupted sessions
- Save completed sessions
- Display daily history and progress

### Done when
- Stored data has a schema version
- Invalid data falls back safely
- Refreshing does not silently lose valid progress

## Milestone 8 — Automated testing

### Review
- Unit and component tests
- Fake timers
- Testing behavior
- Test coverage as a risk signal

### Build
- Domain-rule tests
- Timer transition tests
- Persistence tests
- Component interaction tests
- Keyboard-flow tests

### Done when
- Critical timer behavior is protected
- Tests are deterministic
- CI can run the entire quality gate

## Milestone 9 — Resilience and performance

### Review
- Error states
- Render performance
- Memoization trade-offs
- Browser capabilities and permissions

### Build
- Storage recovery
- Notification fallback
- Reduced-motion support
- Render and timing review

### Done when
- Failures have safe behavior
- Optimizations are evidence-based
- Accessibility preferences are respected

## Milestone 10 — Professional delivery

### Review
- Branching and commits
- Pull-request communication
- Continuous integration
- Technical documentation
- Versioning and releases

### Build
- Lint, test and build workflow
- Architecture decision records
- Final README and screenshots
- Public deployment
- Version 1.0 release

### Done when
- The default branch passes CI
- A new developer can run the project from the README
- Major decisions and trade-offs are documented
- The deployed application matches the repository

## Initial user story

As a person who needs to maintain focus, I want to start alternating work and rest sessions so that I can organize my time without manually watching the clock.

## Initial state model

- idle
- running
- paused
- completed

Transitions:

- idle → running
- running → paused
- paused → running
- running → completed
- completed → idle
- running → idle through reset

## Non-goals for the first release

- Authentication
- Remote database
- Social network
- Artificial intelligence
- Complex gamification
- Multi-device synchronization

## Suggested issue sequence

1. Define product requirements and acceptance criteria
2. Establish the React and TypeScript foundation
3. Build the semantic timer interface
4. Implement the timer state machine
5. Add responsive styling and themes
6. Add settings and persistence
7. Add session history
8. Add automated tests
9. Add accessibility and performance review
10. Configure CI, documentation and deployment
