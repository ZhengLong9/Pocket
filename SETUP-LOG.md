# Pocket — setup and troubleshooting log

Date: 6 November 2026

## What was created

The application lives in `pocket/` inside the existing workspace. The original project plan remains in the parent folder and was updated to reflect the implementation and cancellation of publication.

The first build includes a React/TypeScript application, four screens, browser-local storage, fictional sample data, expense entry/editing/deletion with Undo, monthly budgets, category creation, basic savings goals, automated tests, and a README. Dependencies were installed into the project's `node_modules/` folder, with a lockfile recording their resolved versions.

## Permissions and why they were requested

These were requests to run specific development commands with normal local access when the restricted execution environment could not complete them. They did not grant the application account access or financial permissions. Some later runs reused permission already granted, so the number of command invocations is not the number of prompts you saw.

| Action                                            | Why permission was needed                                                                                                      | What the command did                                                                                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Download project dependencies                     | The initial restricted installation made no progress and was stopped.                                                          | Connected to the npm package registry, downloaded the libraries declared in `package.json`, and wrote the project dependencies and normal package-manager cache files.                                  |
| Use a newer npm installer                         | The installed npm 10.9.2 then crashed during dependency resolution with `Cannot read properties of null (reading 'edgesOut')`. | Ran npm 11 through `npm exec` to complete the installation. It did not replace the system's installed npm or Node.js.                                                                                   |
| Run automated tests with normal file access       | The test runner failed with `EPERM` while renaming temporary cache files.                                                      | Allowed Vitest to create its temporary files and execute the local tests. Subsequent test runs used the same approach.                                                                                  |
| Check the local preview                           | A request to `127.0.0.1:5173` was blocked with a socket-permission error.                                                      | Requested the dashboard's local HTTP address to check that it responded. This was a local connectivity check.                                                                                           |
| Run the preview server with normal network access | The browser could not reach the preview started in the restricted environment.                                                 | Restarted the Vite development server bound to `127.0.0.1:5173`, then confirmed a successful HTTP 200 response and opened the dashboard. No firewall, proxy, or Windows security settings were changed. |
| Install the code formatter                        | Prettier was added after the initial implementation to make the source easier to read.                                         | Downloaded one additional development package using the temporary npm 11 installer, then formatted the project files.                                                                                   |

## Issues found and fixes applied

| Issue                                                                                                        | Fix                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Initial dependency installation stalled; the next attempt exposed an npm resolver crash.                     | Stopped the stalled process and completed installation with temporary npm 11.                                                                                                                          |
| Tests could not write their temporary cache files.                                                           | Reran them with normal local file access.                                                                                                                                                              |
| TypeScript rejected the mock callback type in the modal test.                                                | Gave the test helper the same explicit input signature as the real save callback.                                                                                                                      |
| A category validation message became part of the form control's label, making its accessible name unstable.  | Added stable accessible names for the category and date controls, while retaining associated error descriptions.                                                                                       |
| The local browser could not connect to the restricted preview process.                                       | Restarted the server with normal network access and verified it was reachable.                                                                                                                         |
| The initial JavaScript bundle was about 823 kB before compression.                                           | Loaded the chart and secondary screens separately. The main bundle became about 442 kB; the chart is a separate roughly 362 kB download. This splits loading rather than eliminating the chart's code. |
| The Singapore currency formatter produced `$`, which was less explicit than the design.                      | Kept locale-aware formatting and explicitly displayed the `S$` currency symbol.                                                                                                                        |
| Sample creation timestamps could sort fictional transactions ahead of newly entered records after a refresh. | Set generated sample timestamps to the start of their Singapore calendar date. Existing stored records were not rewritten.                                                                             |
| At a 390 px mobile width, an invisible table-header label caused page-level horizontal overflow.             | Replaced that hidden text element with an accessible header label. The wide transaction table still scrolls within its own container.                                                                  |
| React Fast Refresh warned about a non-component export from the expense component.                           | Kept the form-schema helper private to the component file.                                                                                                                                             |
| Source files needed consistent formatting.                                                                   | Added a Prettier configuration and formatting commands, then formatted the source.                                                                                                                     |

The requested removal of the redundant visible “Month” label and dark transaction text were already incorporated into the design before the React build and were carried into the application.

## What was verified

- All 19 automated tests passed. They cover currency parsing, calendar boundaries, forecasts, matching recorded bill payments, savings calculations, storage separation/failures, and modal interactions.
- The final production build and TypeScript checks passed.
- The formatting check passed. A subsequent one-line change removed an unnecessary export and the production build passed again.
- Browser testing confirmed adding an expense while viewing another month, defaulting to today's date, switching to the saved expense's month, updating totals, and keeping the record after a refresh.
- Editing, deleting, and Undo were checked in the running application.
- The personal workspace was checked to start empty and remain separate from the sample workspace.
- Budget and Goals navigation were checked, along with desktop and narrow-screen layouts. The mobile expense modal fitted within the viewport after the overflow fix.

The browser test used a fictional expense of S$12.30, edited it to S$13.30, exercised Undo and deletion, and removed the test expense afterward. No real financial transactions were made.

## State at handoff

- Publication was cancelled following your clarification. No Site was created or deployed.
- No Supabase, OpenRouter, bank, or other account was connected. No API keys were added.
- Application records are stored in the browser's localStorage, with separate sample and personal datasets. They are not synced or encrypted by this application.
- The temporary development server used for verification was stopped. Start it again with `npm run dev` from `pocket/`.
- Node.js and the system's npm installation were unchanged. Project packages, the lockfile, and normal npm cache entries remain on disk.
- Backend accounts, income schedules, recurring-bill management, category archiving, import/recovery, and AI are future milestones. The current README describes these limits.

## Useful commands

```powershell
cd pocket
npm run dev
```

```powershell
npm test
npm run typecheck
npm run build
npm run format:check
```
