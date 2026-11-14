# JamBlocks Development Plan

## Current State

- Git is initialized on `main`; the project baseline is committed as `5290926` (`chore: establish project baseline`).
- There is no automated test script or existing test suite. Production builds pass; Vite reports the existing large-chunk advisory.
- Hardware MIDI works in the user's browser. Local two-tab collaboration checks pass; external signaling is unavailable in this environment.

## Work Order

### 1. Audio and MIDI correctness — implementation complete, manual checks pending

- [x] Preserve master effect settings before audio initialization and apply them when the audio graph is created.
- [x] Serialize first-time audio initialization so simultaneous MIDI notes cannot create duplicate audio graphs.
- [x] Make WAV export honor master effects, track macros, and solo state.
- [x] Schedule exported notes chronologically and prevent same-time retriggers of shared metallic drum synths.
- [x] Route hardware MIDI Note On and Note Off to sustained instrument voices.
- [x] Check MIDI device discovery and playback in a browser (user-confirmed).
- [ ] Check MIDI hot-plugging and exported audio in a browser; the local offline render stalled before producing a result.

### 2. Collaboration correctness — implementation complete, independent-device check pending

- [x] Prevent simultaneous peers from duplicating starter state by using deterministic IDs and keyed Yjs maps.
- [x] Use keyed records for tracks and blocks and clean up provider/document listeners.
- [x] Store tracks and blocks as nested Yjs maps so concurrent edits to distinct fields (including macro parameters) merge; note arrays remain atomic fields.
- [x] Schedule peer play commands against a shared future timestamp; require a local Play gesture when the browser has not activated audio.
- [x] Check two-peer join, concurrent macro edits, reconnect persistence, and synchronized play/pause/stop in two browser tabs.
- [ ] Validate transport and collaborative state across independent devices using the signaling service.

### 3. Playback and project lifecycle — complete

- [x] Keep the scheduler stable while editing and stop playback at the end of a non-looping project.
- [x] Make non-looping play and stop start from bar 1; looping playback uses the configured loop start.
- [x] Clamp seeks to project bounds and quantize them to sixteenth-note steps.
- [x] Reconcile playhead state when loop settings or project bounds change during playback.
- [x] Defer local project save/load for now; room state remains ephemeral when all peers leave.

### 4. Verification and release baseline — local checks complete, external checks pending

- [x] Restore writable Git metadata, inspect the baseline diff, and commit the existing project before future feature commits.
- [x] Assess automated coverage; no test runner or existing test suite is present, so adding tests is not feasible without introducing a new testing stack.
- [ ] Complete the remaining external-device, MIDI hot-plug, and WAV-export smoke checks.
- [x] Run `npm run build`; TypeScript and Vite production compilation pass. Vite reports the existing large-chunk advisory.
- Regenerate `dist` only as part of an intentional build/release workflow.
