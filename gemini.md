# Dungeon ProcGen Tutorial

A comprehensive guide and visualizer for various procedural generation methods used in dungeon creation.

## Current Methods
- **Random Walk**: Drunkard's walk for organic caves.
- **Cellular Automata**: Smoothing noise into cave systems.
- **BSP (Binary Space Partitioning)**: Structured, room-based layouts.
- **Room Separation (TinyKeep)**: Physics-based rooms with Delaunay & MST.
- **Wave Function Collapse (WFC)**: Constraint-based tiling.
- **Perlin Noise**: Continuous noise thresholding for terrain.
- **Mission Graph**: Abstract flow grammars (Start -> Key -> Lock -> Goal).
- **Voronoi Diagrams**: Region-based partitioning for biomes.
- **Recursive Backtracker**: Perfect mazes with no loops.
- **Space Colonization**: Organic branching growth.
- **Poisson Disk Sampling**: Natural object scatter.
- **Symmetry & Mirroring**: Real-time mirroring for competitive design.
- **Metaballs**: Liquid-like organic merging shapes.

## Planned / Research
- [ ] **L-Systems**: Fractal branching for ruins/plants.
- [ ] **A* Pathfinding**: Solver visualization.
- [ ] **Wang Tiles**: Fast edge-matching patterns.
- [ ] **Markov Chains**: Procedural lore & naming.
- [ ] **Cyclic Graphs**: Designing for loops and shortcuts.
- [ ] **Heightmaps & 3D**: Moving into voxel-based generation.

## Visual Standards
- Use `scripts/utils.js` for Easing and Animation loops.
- Every method should have a "Step-by-Step" or "Real-time" interactive element.
- Code snippets should be included on every child page.
