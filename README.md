# Neon Snake Arena

A stylish browser-based snake game with combo scoring, speed ramping, and a glowing neon UI.

## Features

- Responsive game board rendered on a `<canvas>`.
- Keyboard controls (`WASD` or arrow keys).
- Combo scoring when you chain quick food pickups.
- Increasing speed as score grows.
- Pause, restart, and persistent best score (via `localStorage`).

## Run locally

Because this is a static app, any simple HTTP server works:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Controls

- Move: `W`, `A`, `S`, `D` or arrow keys
- Pause/Resume/Start: `Space`
- Restart: `R`
