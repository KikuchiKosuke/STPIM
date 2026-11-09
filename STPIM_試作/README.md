# STPIM prototype

STPIM is a Japanese, desktop-first schedule prototype built from the supplied use cases, diagrams, table design, and rough screen plan. It is a static browser app; it does not require a build step or external JavaScript packages.

## Run it

Open `index.html` in a modern browser, or serve this folder locally:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

Demo account: **demo** / **demo1234**. You can also create another account from the registration tab. Demo data is generated for the current date, so the calendar opens on a day with sample blocks and a short history.

## What is included

- Username and password registration, login, logout, and an eight-hour local session.
- Month calendar with day summaries and a selected-day preview.
- Separate timed and priority stacks. Drag a block to the right to clear it; the cleared block flies out and the stack closes. The selected block also has a direct clear action.
- Compact blocks leave room for the clear animation to read clearly. Random clear effects include a strong off-screen launch (57.0%), a screen-edge impact and ricochet (28.0%), glass-like shards (12.5%), and a rare gold burst (2.5%). The rare effect is also called out in the result dialog. Effects respect the operating system's reduced-motion preference.
- Create, edit, delete, copy to another day, start a priority block, enter a missed end time, and undo a clear once.
- Timed schedule variance, time-attack history by explicitly selected series, personal-best comparison, cumulative totals, and status/date filters.
- Browser-local persistence through `localStorage`.

## Decisions used to reconcile the source documents

- Login uses a username. The requirement text says “ID”, the rough login mock shows an email field, and the class/table designs identify `username` as the unique login ID.
- Priority blocks have only unstarted and complete states. Timed blocks become missed after their planned end time. This follows the requirement text and domain/class descriptions; the table-design prose incorrectly says priority blocks cannot be missed but its check-constraint summary does not consistently encode that rule.
- A time-attack block joins a series only when the user selects that past series. Copying keeps the series and direction. A matching title alone does not join records.
- The app derives timed variance from planned end versus actual end. It checks overdue status when rendering instead of relying on a server batch job.
- Undo removes the completion and its result once per block. An overdue timed block can immediately appear as missed again because its scheduled end has passed.

## Prototype boundary

This app is for trying the interaction and UI. Accounts, passwords, sessions, schedules, and results live in browser storage; password handling is not suitable for production. There is no Django server, shared database, cloud backup, cross-device sync, server-side session expiry, or scheduled background job. Those require the production backend and deployment environment described in the project plan.
