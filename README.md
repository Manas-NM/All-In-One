# StudentOS (GoodNotes Redesign, Expo SDK 54)

StudentOS is now rebuilt as a **GoodNotes-style notebook system** while preserving the existing productivity modules (Tasks, Habits, Finance, Settings, Flashcards, OCR, AI).

## What changed

### 1) SDK Downgrade
- Expo SDK downgraded to **54**
- React Native aligned to SDK-54 compatible versions
- Expo native modules aligned with SDK 54 versions

### 2) New Notebook Architecture
- Data model: **Library → Folders → Notebooks → Pages**
- New SQLite v4 entities:
  - `folders`
  - `notebooks`
  - `pages`
  - `canvas_objects`
  - `page_search` (FTS5)
- Migration system:
  - Legacy `notes` are converted to one notebook with one page
  - mapping stored in `legacy_note_mapping`

### 3) GoodNotes-style Editor
- New notebook library grid screen (replaces old notes list behavior)
- New page-oriented editor with:
  - Skia canvas rendering
  - Page templates: lined, grid, dotted, blank, cornell
  - Page sidebar, add/delete/duplicate
  - Floating toolbar and Zen mode toggle
  - OCR and AI summary hooks at page level
  - Task linking at page level (`tasks.pageId`, `tasks.notebookId`)
  - Flashcard deck linking at page/notebook level

### 4) Storage improvements
- Per-page drawing persistence via **MessagePack** blobs (`.msgpack`)
- Legacy note JSON storage kept for compatibility
- Multi-page notebook PDF export helper

## Existing modules preserved
- Finance tracker (unchanged)
- Habit tracker (unchanged)
- Settings + OpenAI API key management (unchanged)
- Flashcards and Tasks preserved and extended with notebook/page linkage

## Run
```bash
npm install
npx expo start
```

## Notes
- This redesign is local-first and SQLite-backed.
- Legacy note routes remain backward-compatible through migration mapping.
