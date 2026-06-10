# Stenobar for Raycast

Control [Stenobar](https://stenobar.app) and search its library straight from
Raycast. The extension wires up Stenobar's two automation surfaces:

- the **`stenobar://` URL scheme** — to act (record, dictate, capture, mark), and
- the **library index** (`index.json`) — to read (search recordings and thoughts).

## Commands

### Search

| Command | What it does |
| --- | --- |
| **Search Recordings** | Browse and filter recordings from the library index. Filter by project, toggle a detail panel, open in Stenobar, copy the deep link. |
| **Search Thoughts** | Browse captured thoughts, see category/status/destination, open the routed item, open the Thoughts inbox. |

### Actions (no-view)

| Command | Deep link |
| --- | --- |
| **Toggle Recording** | `stenobar://record/toggle` |
| **Start Recording** | `stenobar://record/start` |
| **Stop Recording** | `stenobar://record/stop` |
| **Dictate** | `stenobar://dictate` |
| **Capture Thought** | `stenobar://thought` |
| **Drop Marker** | `stenobar://marker` |
| **Open Library** | `stenobar://library` |
| **Open Thoughts Inbox** | `stenobar://thoughts` |
| **Open Settings** | `stenobar://settings` |

Assign Raycast hotkeys or aliases to the action commands for one-keystroke
recording and dictation.

## Requirements

- **Stenobar** installed and launched at least once. The search commands read
  `~/Library/Application Support/Stenobar/index.json`, which Stenobar writes on
  launch and keeps updated. If it doesn't exist yet, the search commands show a
  prompt to open Stenobar.

## Preferences

- **Index File** — optional override for the path to `index.json`. Leave empty
  to use the default location.

## Development

```sh
npm install
npm run dev     # ray develop — hot-loads into Raycast
npm run lint
npm run build
```

## Notes

- Transcript text is intentionally not in the index (size / privacy); full-text
  search lives inside Stenobar. The list shows whether a transcript exists.
- The bundled icon is a placeholder — replace `assets/icon.png` with a polished
  512×512 icon before submitting to the Raycast Store.
