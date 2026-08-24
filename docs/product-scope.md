# Product Scope — Pomodoro Focus Planner

## Product concept

Pomodoro becomes a focus-planning application rather than an isolated countdown timer.

The user plans a small set of tasks for the day, assigns focus sessions to them, runs the timer in the context of the selected task and reviews completed work at the end of the day.

Visual foundation: [Mallow UI](design-system.md).

## Product promise

**Plan lightly. Focus on one thing. See what moved.**

The product should reduce planning friction and make progress visible without turning into a complete life-management platform.

## Primary flow

1. Open Today.
2. Check energy: low, medium or high.
3. Select or create today's essential tasks.
4. Choose one task.
5. Start a focus session.
6. Complete, pause or postpone the task.
7. Review sessions and progress at the end of the day.

## Information architecture

### Today

The default and most important view.

- Date and brief greeting
- Energy check-in
- Daily progress
- Compact day strip
- Essential tasks
- Active-task focus timer
- Recent session summary

### Tasks

- Inbox
- Today
- Upcoming
- Completed
- Project/category filter
- Estimated number of focus sessions

### Calendar

- Day and week views
- Tasks by planned date
- Focus blocks
- Lightweight appointments
- No external calendar integration in the first release

### Projects

- Project name and description
- Tasks
- Planned and completed focus sessions
- Progress derived from task completion

### Reflection

- Sessions completed
- Focus minutes
- Tasks moved or completed
- Short daily note
- No wellness or medical interpretation

## Core entities

### Task

- id
- title
- category or project
- plannedDate
- status
- estimatedPomodoros
- completedPomodoros
- priority
- createdAt
- completedAt

### FocusSession

- id
- taskId
- type
- plannedDuration
- actualDuration
- startedAt
- completedAt
- status

### Project

- id
- name
- description
- color
- status

### DailyCheckIn

- date
- energy: low, medium or high
- note

## MVP

### Today and planning

- [ ] Today view
- [ ] Create, edit, complete and remove a task
- [ ] Choose up to four essential tasks
- [ ] Assign project/category
- [ ] Set an estimated number of Pomodoros
- [ ] Select energy level
- [ ] Daily completion progress

### Focus timer

- [ ] Select a task before or during a focus session
- [ ] Focus, short-break and long-break modes
- [ ] Start, pause, resume and reset
- [ ] Reliable target-timestamp timing
- [ ] Automatic session transitions
- [ ] Record completed focus time against the selected task

### Persistence and quality

- [ ] Local device storage
- [ ] Recovery after refresh
- [ ] Responsive interface
- [ ] Keyboard operation
- [ ] Reduced-motion support
- [ ] Unit and component tests
- [ ] CI and public deployment

## Version 1.1

- [ ] Week strip and calendar view
- [ ] Task inbox and upcoming list
- [ ] Projects view
- [ ] Daily reflection
- [ ] Productivity summary
- [ ] Optional browser notifications

## Explicit non-goals

The first portfolio version will not include:

- Habits
- Home-management modules
- Glow-up tracking
- Personal finances
- Weather API
- Authentication
- Cloud synchronization
- External calendar synchronization
- Multiple users
- AI planning
- Social features

These can appear in the visual reference, but importing all of them would weaken the product's focus.

## UI composition

### Desktop

- Left navigation: Today, Tasks, Calendar, Projects and Reflection
- Top bar: search and create
- Main column: daily context and active timer
- Secondary column: essential tasks and session progress

### Mobile

- Bottom navigation with the three primary destinations
- Active timer first
- Essential tasks immediately below
- Secondary planning views behind deliberate navigation

## Mallow UI mapping

- Warm canvas and porcelain cards
- Active focus session: mint
- Breaks: aqua or sky
- Destructive reset: blush accent plus text
- Achieved daily target: citrus
- Raised actions and recessed time/progress surfaces
- 8-point grid and 44×44 px minimum targets

## Portfolio value

This scope demonstrates:

- Product discovery and scope control
- Domain modeling
- React component architecture
- TypeScript state modeling
- Reliable browser timing
- Local persistence and schema versioning
- Responsive design
- Accessibility
- Automated testing
- Continuous integration
- Technical documentation

## Revised estimate

The integrated MVP is estimated at **36 sessions of 45 minutes** (27 hours).

- Product modeling: 3
- Foundation and tooling: 3
- Mallow UI implementation: 5
- Task and Today flows: 6
- Timer engine and task integration: 6
- Persistence and recovery: 4
- Testing: 4
- Accessibility and responsive review: 2
- CI, documentation and deployment: 3
