# Claude Prompt 001 — Project Foundation

```text
You are implementing one bounded issue in the nughinit/Pomodoro repository.

ISSUE
Create the minimal React + TypeScript application foundation for the Pomodoro Focus Planner.

PRODUCT CONTEXT
This is a public portfolio project that combines daily task planning with a task-linked Pomodoro timer. The detailed product scope is in docs/product-scope.md and the visual direction is in docs/design-system.md. This issue does not implement product features.

TECHNICAL CONTEXT
Use React, TypeScript and Vite. The repository currently contains planning documentation. Preserve all existing documentation and privacy boundaries.

BEFORE EDITING
1. Read AGENTS.md if it exists.
2. Read README.md, docs/product-scope.md and docs/design-system.md.
3. Inspect only the repository root and files needed for project setup.
4. State a plan with no more than 5 short steps.
5. If the repository already has conflicting application setup, stop and report it instead of replacing it.

IN SCOPE
- Create a working React + TypeScript Vite foundation.
- Add the smallest sensible source structure.
- Render a semantic placeholder application shell titled “Pomodoro”.
- Add centralized Mallow UI color, radius and shadow tokens from docs/design-system.md.
- Add scripts for development, build, lint and typecheck.
- Add a clear local setup section to README.md.

OUT OF SCOPE
- Timer logic.
- Task CRUD.
- Calendar, projects or reflection.
- LocalStorage.
- Routing.
- Complete visual design.
- Tests beyond any setup validation strictly required by the chosen template.
- Deployment and CI.
- New state-management or UI libraries.

ACCEPTANCE CRITERIA
- npm install succeeds.
- npm run build succeeds.
- npm run lint succeeds.
- npm run typecheck succeeds.
- The application renders a semantic main region containing the project title.
- Mallow UI tokens are defined centrally and used for the page canvas, surface and primary text.
- Existing documentation remains intact.

DEFINITION OF DONE
The task is finished only when:
- all acceptance criteria are satisfied;
- configuration contains no unexplained disabled quality rules;
- no unrelated files were changed;
- no feature placeholder pretends to be implemented;
- no TODO or knowingly broken setup remains.

TOKEN RULES
- Do not explain basic React, TypeScript or Vite concepts.
- Do not repeat the prompt.
- Do not scan unrelated history or branches.
- Do not paste complete files in the final response.
- Prefer template defaults and existing dependencies.
- Make the smallest coherent change.
- Stop when the Definition of Done is met.

FINAL RESPONSE
Return only:
1. Changed: files and one-line purpose.
2. Verified: commands run and results.
3. Decisions: at most 3 relevant technical decisions.
4. Remaining: only blockers or explicitly deferred scope.
```
