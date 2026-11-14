# JamBlocks Development Plan

## Current State

- Git is initialized on `main`; the project baseline is committed as `5290926` (`chore: establish project baseline`).
- There is no automated test script or existing test suite. The production build passes with the current transport changes.
- The user confirmed hardware MIDI discovery and playback are working. Transport synchronization still needs a two-peer browser check.

## Work Order

### 1. Audio and MIDI correctness — implementation complete, browser checks pending

- [x] Preserve master effect settings before audio initialization and apply them when the audio graph is created.
- [x] Serialize first-time audio initialization so simultaneous MIDI notes cannot create duplicate audio graphs.
- [x] Make WAV export honor master effects, track macros, and solo state.
- [x] Route hardware MIDI Note On and Note Off to sustained instrument voices.
- [x] Check MIDI device discovery and playback in a browser (user-confirmed).
- [ ] Check playback, MIDI hot-plugging, and exported audio in a browser.

### 2. Collaboration correctness — in progress

- [x] Prevent simultaneous peers from duplicating starter state by using deterministic IDs and keyed Yjs maps.
- [x] Use keyed records for tracks and blocks and clean up provider/document listeners.
- [ ] Consider field-level shared records if simultaneous edits to different fields of one track or block must merge.
- [x] Schedule peer play commands against a shared future timestamp; require a local Play gesture when the browser has not activated audio.
- [ ] Check two-peer join, concurrent edits, reconnect, and transport behavior.

### 3. Playback and project lifecycle — in progress

- [x] Keep the scheduler stable while editing and stop playback at the end of a non-looping project.
- [x] Make non-looping play and stop start from bar 1; looping playback uses the configured loop start.
- [x] Clamp seeks to project bounds and quantize them to sixteenth-note steps.
- [ ] Reconcile remote transport timing and playhead state for loop changes.
- [x] Defer local project save/load for now; room state remains ephemeral when all peers leave.

### 4. Verification and release baseline — pending

- [x] Restore writable Git metadata, inspect the baseline diff, and commit the existing project before future feature commits.
- Add focused automated coverage where feasible, then run the browser smoke checks above.
- [x] Run `npm run build`; TypeScript and Vite production compilation pass. Vite reports the existing large-chunk advisory.
- Regenerate `dist` only as part of an intentional build/release workflow.
