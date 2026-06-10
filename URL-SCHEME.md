# Stenobar automation: URL scheme & library index

Stenobar exposes two stable integration surfaces so external tools — a
[Raycast](https://raycast.com) extension, [Alfred](https://alfredapp.com),
macOS Shortcuts, or a shell script — can drive it and search its data:

1. **The `stenobar://` URL scheme** — *act*: open a window, jump to a
   recording, start/stop a recording, dictate, capture a thought.
2. **A JSON index file** — *read*: list and search recordings and thoughts
   (the URL scheme is fire-and-forget and can't return data).

Together they cover the common automation loop: read the index to find an
item, then open it with its deep link.

---

## 1. The `stenobar://` URL scheme

Anything that can open a URL can trigger Stenobar. From a terminal:

```sh
open "stenobar://library"
open "stenobar://record/start"
open "stenobar://recording/4C2E…-UUID"
```

From a Raycast extension (TypeScript):

```ts
import { open } from "@raycast/api";
await open("stenobar://record/toggle");
```

The app must be running, or macOS will launch it first. Unrecognized URLs are
logged and ignored — they never crash or surface an error to the user.

### Commands

| URL | Action |
| --- | --- |
| `stenobar://library` | Open the Recordings library. Aliases: `recordings`, `open`. |
| `stenobar://library?recording=<uuid>` | Open the library and select a recording. |
| `stenobar://library?project=<uuid\|slug>` | Open the library scoped to a project. |
| `stenobar://library?recording=<uuid>&project=<slug>` | Both at once. |
| `stenobar://recording/<uuid>` | Shorthand for `?recording=<uuid>`. This is the canonical "Copy Link" form. |
| `stenobar://project/<uuid\|slug>` | Shorthand for `?project=…`. |
| `stenobar://thoughts` | Open the Thoughts Inbox window. Alias: `inbox`. |
| `stenobar://settings` | Open Settings. Alias: `preferences`. |
| `stenobar://record` | Toggle recording (start if idle, stop if recording). |
| `stenobar://record/start` | Start a recording (no-op if already recording). |
| `stenobar://record/stop` | Stop the current recording (no-op if idle). |
| `stenobar://record/toggle` | Explicit toggle. Also `record?action=start\|stop\|toggle`. |
| `stenobar://marker` | Drop a marker in the in-progress recording. Alias: `mark`. No-op when idle. |
| `stenobar://dictate` | Toggle the dictation HUD (transcribe → paste into the focused app). Alias: `dictation`. |
| `stenobar://thought` | Toggle a Thoughts capture (transcribe → classify → route). Alias: `capture`. |

Notes:

- **Record / dictate / thought / marker** take exactly the same code path as
  the global hotkeys, including the "last-used source + mic" selection for
  recording. A deep link and a key combo are interchangeable.
- A project may be referenced by its **UUID** or its **slug** (the
  lowercase-hyphenated form derived from its name, e.g. *"Work Notes"* →
  `work-notes`). Slugs are stable and human-derivable; the index file (below)
  publishes both.
- The scheme is **case-insensitive** on the host (`STENOBAR://settings` works),
  but project slugs are matched case-insensitively too.

### Getting a recording's link from the app

Right-click any recording → **Copy Link**, or use the **Copy Link** button in a
recording's detail toolbar. Both copy `stenobar://recording/<uuid>` to the
clipboard — paste it into notes, a Raycast quicklink, a Shortcut, anywhere.

---

## 2. The library index (search)

Stenobar maintains a JSON snapshot of the library at a **fixed, install-stable
path** (it does not move when the user relocates their recordings folder):

```
~/Library/Application Support/Stenobar/index.json
```

It's rewritten at launch and (debounced) on every change — new recording,
rename, star, tag, transcript, captured thought, send. Read it directly; do not
poke at the SwiftData `.sqlite` stores, whose schema is internal and unstable.

### Schema

```jsonc
{
  "version": 1,                       // bump signals a breaking change
  "generatedAt": "2026-06-09T12:00:00Z",
  "recordings": [
    {
      "id": "4C2E…-UUID",
      "title": "Weekly standup",
      "startedAt": "2026-06-09T09:00:00Z",
      "duration": 1825.0,             // seconds
      "source": "All System Audio",   // human-readable source label
      "project": "Work",              // project name, or null (ungrouped)
      "projectSlug": "work",          // or null
      "tags": ["meeting", "team"],
      "starred": true,
      "imported": false,
      "hasTranscript": true,
      "url": "stenobar://recording/4C2E…-UUID"   // open it
    }
  ],
  "thoughts": [
    {
      "id": "9A11…-UUID",
      "capturedAt": "2026-06-09T11:30:00Z",
      "text": "Email Bob about the deck",  // raw dictation
      "title": "Email Bob",
      "category": "task",            // task | note | reminder | review_later
      "status": "sent",             // classifying | pending_preview | sending | sent | pending | failed | review_later
      "destination": "Todoist",
      "dueDate": null,               // ISO-8601 or null
      "externalURL": "https://todoist.com/showTask?id=123",  // routed item, or null
      "url": "stenobar://thoughts"   // opens the Inbox
    }
  ]
}
```

Dates are ISO-8601 (UTC). Every entry carries a ready-to-`open` `url`, so a
search result can act without reconstructing the URL grammar.

### Reading it (Raycast / Node)

```ts
import { homedir } from "os";
import { readFile } from "fs/promises";
import { join } from "path";

const INDEX = join(
  homedir(),
  "Library/Application Support/Stenobar/index.json"
);

type Recording = {
  id: string; title: string; startedAt: string; duration: number;
  source: string; project: string | null; projectSlug: string | null;
  tags: string[]; starred: boolean; imported: boolean;
  hasTranscript: boolean; url: string;
};

export async function loadIndex() {
  const raw = await readFile(INDEX, "utf8");
  return JSON.parse(raw) as {
    version: number;
    generatedAt: string;
    recordings: Recording[];
    thoughts: unknown[];
  };
}
```

A Raycast "Search Recordings" command then filters `recordings` by title / tag
/ project client-side and offers `open(item.url)` as the primary action; a
"Search Thoughts" command does the same over `thoughts`. Pair these with
no-argument commands that fire `stenobar://record/toggle`,
`stenobar://dictate`, and `stenobar://thought` for a full extension.

### Caveats

- The file may not exist until Stenobar has launched at least once. Handle
  `ENOENT` by prompting the user to open the app.
- `version` is `1` today. If it differs from what your tool expects, warn
  rather than assume the shape.
- Transcript *text* is intentionally not in the index (size / privacy). The
  index reports `hasTranscript`; full-text search lives inside the app.
