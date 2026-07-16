# Dungeon ProcGen Tutorial

A live-visualizer tutorial site for procedural dungeon generation algorithms.

## What it is

A single hub page (`index.html`) linking out to 13 self-contained method pages, each with a canvas visualizer, step-by-step or real-time animation, and the code snippet behind it. Built as a learning reference and demo collection for common dungeon/level-gen techniques used in games.

## Methods

- **Random Walk** — drunkard's walk for organic caves
- **Cellular Automata** — smoothing noise into cave systems
- **BSP** — recursive space partitioning for room-based layouts
- **Room Separation (TinyKeep)** — physics-based rooms + Delaunay triangulation + MST
- **Wave Function Collapse (WFC)** — constraint-based tiling
- **Perlin Noise** — noise thresholding for terrain
- **Mission Graph** — abstract flow grammars (Start -> Key -> Lock -> Goal)
- **Voronoi Diagrams** — region-based partitioning for biomes
- **Recursive Backtracker** — perfect mazes with no loops
- **Space Colonization** — organic branching growth
- **Poisson Disk Sampling** — natural object scatter
- **Symmetry & Mirroring** — real-time mirroring for competitive map design
- **Metaballs** — liquid-like organic shape merging

Planned/research (not built yet): L-Systems, A* pathfinding, Wang Tiles, Markov chains, cyclic dungeons, heightmaps/3D.

## Run it

No build step, no dependencies. Just open `index.html` in a browser, or serve the folder locally:

```
npx serve .
```

Each method lives at `methods/<name>/index.html` with its own `script.js`.

## Tech stack

Vanilla HTML/CSS/JS. Canvas 2D for all visualizers. Shared easing/animation loop in `scripts/utils.js`, shared styling in `styles/main.css`. No frameworks, no build tools.
