# TimVerse Story Forge

TimVerse Story Forge is a single-storybook authoring studio built with React, TypeScript, Tailwind CSS, and shadcn-inspired UI
patterns. Authors can compose page-by-page narratives with synchronized imagery and audio, then share the result as print-ready
PNGs, a static web booklet, or a JSON schema.

## Features

- **Compose workflow** with three-panel layout for story metadata, rich page editing, and image tools.
- **Drag-to-reorder pages** using dnd-kit and a contenteditable rich text surface with quick formatting controls.
- **Image management** including paste/upload support, fit modes (cover, contain, letterbox), smart crop helpers, and badge-ready
  cover designer.
- **Audio timeline** for book-wide or per-page narration, waveform preview, and timestamp markers that drive auto page flips in
  the reader.
- **Reading experience** powered by `react-pageflip` with responsive single/two-page spreads, keyboard navigation, fullscreen
  support, captions, and time-synced auto-flip.
- **Offline storage** of draft and published versions via IndexedDB for seamless local persistence.
- **Export suite** to download print-ready PNGs, a static HTML pack, or sharable JSON payloads.
- **Accessibility & internationalization** hooks including alt text, captions, high-contrast mode, prefers-reduced-motion
  handling, and i18n-ready copy (English defaults included).

## Getting Started

```bash
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) and start authoring. The app stores one draft and one published story in the
browser. Page text uses `---` as a natural delimiter when pasting multi-page manuscripts.

### Scripts

| Command         | Description                                           |
| --------------- | ----------------------------------------------------- |
| `npm run dev`   | Start Vite dev server with hot module replacement.    |
| `npm run build` | Type-check with `tsc` and produce an optimized build. |
| `npm run lint`  | Run ESLint with the Vite + TypeScript configuration.  |

## Tech Stack

- React 19 with Vite and TypeScript
- Tailwind CSS 3, Tailwind Merge, and custom shadcn-style primitives
- dnd-kit for drag-and-drop, React PageFlip for GPU-friendly page turns
- idb for IndexedDB persistence, JSZip + html-to-image for exports
- i18next for localization scaffolding

## Project Structure Highlights

- `src/components/compose` — Compose mode panels (metadata, pages, image tools, audio timeline).
- `src/components/read` — Page-flip reader with sync controls.
- `src/components/export` — Export dialog for PNG, web, and JSON outputs.
- `src/state/story-context.tsx` — Story state management, validation, and persistence.
- `src/storage` — IndexedDB abstraction.

## Notes

- Images should target 800–1080px width by 1280–1366px height. The editor flags out-of-range assets and offers fit options.
- Audio uploads accept MP3/WAV and render a lightweight waveform for scrubbing and markers.
- Drafts are saved automatically when you validate, save, or continue to Reading mode. Publishing can be layered on a future
  backend API by replacing the storage abstraction.
