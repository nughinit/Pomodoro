# Claude Coding Workflow

## Goal

Use Claude as a focused implementation agent while keeping each task small, verifiable and inexpensive in tokens.

## Operating model

- One prompt equals one issue.
- Each issue should normally fit in one 45-minute session.
- The prompt names the allowed files or asks Claude to identify the smallest necessary file set.
- Claude reads only the files needed for the issue.
- Every issue includes acceptance criteria and a Definition of Done.
- Claude stops after the requested task and does not begin adjacent work.
- Broad audits, speculative refactors and unrequested dependencies are prohibited.
- The final response is a compact implementation report, not a tutorial.

## Prompt template

```text
You are implementing one bounded issue in the nughinit/Pomodoro repository.

ISSUE
[One concrete outcome.]

PRODUCT CONTEXT
[Only the product facts needed for this issue.]

TECHNICAL CONTEXT
[Relevant stack, architecture, constraints and known files.]

BEFORE EDITING
1. Read AGENTS.md if it exists.
2. Inspect only the files required for this issue.
3. State a plan with no more than 5 short steps.
4. If the task cannot be completed without materially expanding scope, stop and report the blocker.

IN SCOPE
- [Required change]
- [Required state]
- [Required test or documentation]

OUT OF SCOPE
- [Adjacent feature]
- [Unrequested refactor]
- [New dependency unless strictly required]

ACCEPTANCE CRITERIA
- [Observable behavior]
- [Observable behavior]
- [Quality condition]

DEFINITION OF DONE
The task is finished only when:
- the acceptance criteria are satisfied;
- relevant tests exist and pass;
- lint and typecheck pass for changed code;
- documentation is updated only if behavior or setup changed;
- no unrelated files were changed;
- no TODO, placeholder or knowingly broken state remains inside this issue.

TOKEN RULES
- Do not explain concepts I did not ask about.
- Do not repeat the prompt.
- Do not scan the whole repository.
- Do not paste complete files in the final response.
- Reuse existing patterns and dependencies.
- Make the smallest coherent change.
- Stop when the Definition of Done is met.

FINAL RESPONSE
Return only:
1. Changed: files and one-line purpose.
2. Verified: commands run and results.
3. Decisions: at most 3 relevant technical decisions.
4. Remaining: only blockers or explicitly deferred scope.
```

## Task sizing rule

A task is too large when it combines more than one of these outcomes:

- project setup;
- domain modeling;
- visual component construction;
- persistence;
- routing;
- testing infrastructure;
- CI;
- deployment.

Split it before asking Claude to implement it.

## Context budget

Include in each prompt:

- one issue;
- relevant product rule;
- relevant architecture rule;
- relevant visual rule;
- exact acceptance criteria.

Do not include:

- the entire roadmap;
- long conversation history;
- unrelated Life OS or Intimatio context;
- repeated design-system explanations;
- future features.

Point Claude to repository documents instead:

- `docs/product-scope.md`
- `docs/project-plan.md`
- `docs/design-system.md`

## Review gate after every Claude task

1. Check the diff for unrelated changes.
2. Run or confirm tests, typecheck, lint and build as relevant.
3. Compare behavior with acceptance criteria.
4. Record any decision that affects later tasks.
5. Commit only after the gate passes.

## First implementation sequence

1. Establish React + TypeScript project foundation.
2. Add quality scripts and test infrastructure.
3. Define domain types and pure timer transitions.
4. Implement Mallow tokens and application shell.
5. Build the accessible Today view.
6. Build task creation and completion.
7. Build the reliable timer engine.
8. Connect focus sessions to tasks.
9. Add local persistence and recovery.
10. Add summaries, accessibility review, CI and deployment.
