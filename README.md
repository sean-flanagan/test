# Neon Snake Arena

A stylish browser-based snake game with combo scoring, speed ramping, and a glowing neon UI.

## Features

- Responsive game board rendered on a `<canvas>`.
- Keyboard controls (`WASD` or arrow keys).
- Combo scoring when you chain quick food pickups.
- Increasing speed as score grows.
- Pause, restart, and persistent best score (via `localStorage`).

## Run locally

### Option 1 (preview-friendly)

```bash
npm start
```

This runs a small Node static server on port `3000` (or `PORT` if your environment sets it).

### Option 2

```bash
python3 -m http.server 8000
```

Then open the matching URL in your browser.

## Controls

- Move: `W`, `A`, `S`, `D` or arrow keys
- Pause/Resume/Start: `Space`
- Restart: `R`
