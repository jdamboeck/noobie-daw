# JamBlocks 🎵
*A Serverless, WebRTC-Powered Collaborative Browser DAW for Beginner Musicians*

JamBlocks is a web-first music workstation designed from the ground up to eliminate the steep learning curves of traditional DAWs.

---

## ✨ Key Features

### 1. 🛡️ Musical Guardrails (Scale Lock)
- **Impossible to sound dissonant:** With **Scale Lock** enabled, all incoming notes—whether from pre-made clips, your computer keyboard, or an external hardware MIDI controller—are automatically snapped in real time to the selected key and scale.
- Supported scales: **Major, Natural Minor, Major Pentatonic, Minor Pentatonic, Blues, and Dorian**.
- **Real-Time Re-Harmonization:** Change the song key from C Major to E Minor, and all blocks dynamically re-transpose without audio pitch-shifting artifacts.

### 2. 🧱 "Smart" Drag-and-Drop MIDI Blocks
- Categorized library of building blocks:
  - **Beat Box (Drums):** Four on the Floor, 90s Boom Bap, Trap Rolls, Lo-Fi Chill Half-Time.
  - **Basslines:** Driving Eighths, Walking Groove, Funky Octave Bounce, Sub Drone.
  - **Keys & Chords:** Sad Pop (vi-IV-I-V), Heroic Anthem (I-V-vi-IV), Neo-Soul Chill (ii-V-I), 12-Bar Blues.
  - **Lead & Melodies:** Catchy Pop Hooks, Neon Arp Cascades, 8-Bit Chiptunes.
- Visual block editing with **16/32-step drum sequencers** and **gold-highlighted in-key piano rolls**.

### 3. 🎹 Zero-Config Web MIDI Device Support
- **Plug-and-play:** Connect any USB or Bluetooth MIDI keyboard (Akai, Novation, Arturia, Yamaha, etc.).
- Auto-detects port connections and dispatches NoteOn / NoteOff with velocity sensitivity.
- **Hardware Scale Snapper:** External physical key presses are filtered and snapped in real time.
- **Virtual Controller Fallback:** On-screen 2-octave piano and 4x4 velocity drum pads with QWERTY keyboard shortcuts.
- **Firefox Web MIDI:** Click **Connect MIDI** to grant permission. In some Firefox on Linux builds, ensure `dom.webmidi.enabled` is set to `true` in `about:config`.

### 4. 🌐 Serverless WebRTC Multiplayer Collaboration
- **No accounts, no central servers, zero hosting costs:** State is synchronized using **Yjs CRDTs** over **WebRTC DataChannels** (`y-webrtc`).
- Share a single link (`?room=your-room-name`) to jam with friends.
- **Collaborative Awareness:** Live cursors, collaborator avatar tags, track selection indicators, and synchronized playhead transport.

### 5. 🎛️ Audio Engine & Master Effects
- Built on **Tone.js** and the high-precision **Web Audio API** lookahead scheduler.
- 4 curated instrument engines with natural-language macro knobs (*Punch, Room, Growl, Cutoff, Brightness, Dreamy Chorus, Echo, Glide*).
- Master Bus with **Reverb, Delay, Tape Saturation, Lowpass/Highpass Filter, and Brickwall Limiter**.
- **Offline WAV Exporter:** Renders songs into 16-bit stereo `.wav` audio files in seconds.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production
npm run build
```

Open `http://localhost:3000` in Google Chrome, Edge, Brave, or Firefox.

### Deploy to GitHub Pages

Push to the `main` branch to build and deploy the app with the workflow in `.github/workflows/deploy-pages.yml`. In the repository settings, open **Pages** and set the build source to **GitHub Actions**. Project sites automatically use the repository path; user or organization sites use the domain root.

### Testing Multiplayer
1. Open `http://localhost:3000/?room=jam-test` in one browser tab.
2. Open the same URL in an Incognito window or on a friend's computer.
3. Edit blocks, press play, or play notes—changes appear instantly across all peers!
