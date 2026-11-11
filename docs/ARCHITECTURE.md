# Architecture

AppIdea is a fully client-side product workspace. There is no backend: every
record is encrypted with AES-256 in the browser and persisted to
`localStorage`, and the production build is a static export.

## Components

| Path | Responsibility |
|---|---|
| `src/app/page.tsx` | Landing page and entry points |
| `src/app/ideation/page.tsx` | Idea workspace: capture a product concept and generate Charter, PRD, TDD, Roadmap and Pitch Deck |
| `src/app/prompts/page.tsx` | Prompt library with categories and search |
| `src/app/admin/page.tsx` | Import/export and data management |
| `src/lib/storage.ts` | AES-256 encryption plus the `localStorage` read/write helpers |
| `src/lib/csvUtils.ts` | RFC-4180-style CSV parsing (quoted fields, embedded commas/newlines/JSON) and CSV generation |
| `src/lib/importUtils.ts` | File import for JSON and CSV |
| `src/lib/exportUtils.ts` | PDF (jsPDF) and PPTX (pptxgenjs) export |
| `src/lib/types.ts` | Shared record types and the default category list |

## Data flow

```
form input → React state → encryptData() → localStorage
localStorage → decryptData() → React state → render / export
CSV or JSON file → parseCSV()/importData() → validated rows → encrypted store
```

Every write goes through `saveToStorage`, so plaintext never reaches disk. The
storage helpers no-op when `window` is undefined, which keeps the modules
importable in a Node test process.

## Exports

PDF and PowerPoint documents are generated entirely in the browser and
downloaded as blobs; no document is uploaded anywhere.

## Trust boundaries

- The encryption key comes from `NEXT_PUBLIC_SECRET_KEY` or a documented
  default, and is applied client-side only.
- Imported files are parsed and validated before anything is written to the
  store.
- No analytics, no server logs, no remote persistence.

## Verification

```bash
npx tsc -p tsconfig.test.json
node --test "dist-test/test/*.test.js"
```

The suite covers CSV parsing edge cases (quoted commas, doubled quotes, quoted
newlines, embedded JSON, header-only input) and the encrypted storage
round-trip. CI runs both commands on every push.
