# PEAKS → PODIUM 🏔️🥇

Track Cleo & Lila's snowboard progression from beginner to the **2034 Winter Olympics** in Salt Lake City.

A static web app (no build step, no dependencies). All data is stored in the browser's `localStorage`.

## Features

- **Countdown** to the 2034 Winter Olympics opening ceremony
- **Mountain Conditions** dashboard: live weather from the [Open-Meteo API](https://open-meteo.com/) (free, no API key) for 6 mountains (Jack Frost, Big Boulder, Park City, Snowbird, Brighton, Deer Valley), with a shred-score gauge, best-pick recommendation, and 7-day snowfall forecast
- **Rider profiles**: XP, streaks, discipline focus, per-rider progress rings
- **Daily challenges** per rider (+10 XP each)
- **8-phase progression timeline** (2026–2034) with checkable skills, tips, and drills
- **Skill tree** visualization with dependency-based unlocking
- **Achievement badges**
- **Session log**: date, rider, notes, and 1–5 rating per day on the mountain
- **Mountain Shred game**: canvas-based race-down-the-mountain game (solo and 2-player head-to-head), WASD/arrows, with WebAssembly snow particles
- **Video Coach**: drop a trick video in for AI coaching feedback (needs a Gemini API key, stored locally in the browser)
- **Export / Import**: back up all rider data as JSON from the footer

## Run it

Just open `index.html` in a browser, or serve the folder so the weather fetch and game assets load cleanly:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

The Mountain Conditions panel needs internet access for the Open-Meteo API; everything else works offline.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | All styling (aurora theme, Olympic rings, glassmorphism) |
| `app.js` | Phases, skill tree, countdown, session log, state persistence |
| `interactive.js` | Daily challenges, achievements, toast notifications |
| `mountain-conditions.js` | Open-Meteo weather fetch, shred-score gauge, forecast chart |
| `shred-game.js` | Mountain Shred game logic |
| `shred-renderer-gl.js` | WebGL renderer for the game |
| `shred-particles.wasm` / `.wat` | Particle sim (WebAssembly) |
| `video-coach.js` | Video upload + AI coaching analysis |
| `rider_*.png`, `snowboarder.png` | Sprites |

## License

MIT.
