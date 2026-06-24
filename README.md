# Chronos — Stopwatch Web Application

A precision stopwatch styled like a real chronometer: a tick-marked bezel ring sweeps as progress, with Stopwatch, Pomodoro, and Workout Interval modes. Built in vanilla JS, no build step, no dependencies.

## Running it

Just open `index.html` in a browser. There's no server, bundler, or install step.

> Voice recognition and spoken announcements only work over `http(s)://`, not `file://`, in some browsers. If those features seem silent, serve the folder locally instead:
> ```
> python3 -m http.server 8000
> ```
> then visit `http://localhost:8000`.

## Project structure

```
stopwatch/
├── index.html              Page structure, all element IDs, script load order
├── styles.css              All visual design — themes, layout, animations
└── js/
    ├── format.js           ms → display strings (00:00.00, lap rows, CSV)
    ├── timer-engine.js      Stopwatch core: start / pause / reset / lap, rAF-driven
    ├── modes.js             Pomodoro & Workout Interval sequencing (IntervalRunner)
    ├── sound-engine.js      Synthesized tones for start/pause/lap/milestone (no audio files)
    ├── voice-commander.js   Speech RECOGNITION — listens for "start", "lap", etc.
    ├── voice-announcer.js   Speech SYNTHESIS — speaks "Welcome to Chronos", "2 laps completed"
    ├── confetti.js          Canvas confetti burst on milestones
    ├── ambient-field.js     Background drifting-dot animation (respects reduced-motion)
    ├── theme-manager.js     Dark / Light / Neon theme switching + persistence
    ├── storage.js           LocalStorage session history + CSV export
    └── app.js               Wires every module above to the DOM. Start here to trace behavior.
```

**Read order if you're new to the code:** `app.js` first — it's the only file that touches the DOM and calls into everything else. Each other file is a self-contained module with no DOM access, so you can read them in isolation.

## Features

| Category | Feature |
|---|---|
| Core | Start, Pause, Reset, Lap, millisecond precision |
| Modes | Stopwatch (count up) · Pomodoro (25/5/25/5/25/15) · Workout Interval (30s work / 15s rest ×4) |
| Visual | Animated circular progress ring, Dark/Light/Neon themes, fastest/slowest lap highlighting, stats panel (fastest/slowest/average/count) |
| Audio | Start/pause/reset/lap tones, milestone chime, mute toggle |
| Voice | Spoken commands in ("start", "pause", "lap", "reset") via `voice-commander.js`; spoken feedback out ("2 laps completed", "Welcome to Chronos") via `voice-announcer.js` |
| Data | Export laps as CSV, session history saved to LocalStorage |
| Other | Keyboard shortcuts, glassmorphism-leaning panel UI, responsive layout, ambient background animation, confetti on milestones (every 5 laps, every hour, every interval step) |

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Start / Pause |
| `L` | Lap (Stopwatch mode only) |
| `R` | Reset |
| `M` | Mute / unmute sound effects |
| `T` | Cycle theme |

## How the pieces talk to each other

Nothing in `js/` except `app.js` touches the DOM. Each module is an `EventTarget` (or plain object) that either:
- **emits events** other code can listen to — `timer-engine.js`, `modes.js`, `voice-commander.js` — or
- **exposes plain methods** to call directly — `format.js`, `sound-engine.js`, `voice-announcer.js`, `storage.js`, `theme-manager.js`, `confetti.js`, `ambient-field.js`.

`app.js` is the only file that:
1. Creates instances of every module
2. Subscribes to their events
3. Updates the DOM in response
4. Forwards button clicks / keypresses back into the modules

This means **adding a class to `js/` does nothing on its own.** A new module is only "live" once `index.html` has a `<script>` tag loading it (in the right order, before `app.js`) **and** `app.js` actually instantiates it and calls its methods somewhere. See the voice-announcer addition as the reference example: it touches all three files (`voice-announcer.js`, `index.html`, `app.js`) together.

## Adding or changing spoken announcement phrases

Edit the canned-phrase methods inside `js/voice-announcer.js` (`welcome()`, `lapCompleted()`, `started()`, `paused()`, `reset()`, `stepChanged()`, `sequenceComplete()`, `hourReached()`). No other file needs to change for wording tweaks — `app.js` just calls these methods by name.

## Browser support notes

- **Voice recognition** (`voice-commander.js`) needs `SpeechRecognition` / `webkitSpeechRecognition` — Chrome and Edge support it; Firefox and Safari currently don't. The mic button auto-hides if unsupported.
- **Voice announcements** (`voice-announcer.js`) need `speechSynthesis`, supported in all modern browsers. Most browsers block spoken audio until the page registers a real click or keypress, so the welcome line fires on first interaction, not on load.
- **LocalStorage** is used for theme, mute state, announcement toggle, and session history. Clearing site data resets all of these.