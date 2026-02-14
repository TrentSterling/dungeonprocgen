const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const stepBtn = document.getElementById('stepBtn');
const autoBtn = document.getElementById('autoBtn');
const status = document.getElementById('status');

const GRID_SIZE = 16;
const TILE_SIZE = 25;
const ANIM = new Animator();

// Tiles: 0: Water, 1: Sand, 2: Grass, 3: Mountain
const COLORS = ['#2196F3', '#FFD54F', '#4CAF50', '#795548'];
// Rules: What can be adjacent? (Index is tile ID, Value is array of allowed neighbors)
const ADJACENCY = [
    [0, 1],       // Water touches Water, Sand
    [0, 1, 2],    // Sand touches Water, Sand, Grass
    [1, 2, 3],    // Grass touches Sand, Grass, Mountain
    [2, 3]        // Mountain touches Grass, Mountain
];

let grid = [];
let stack = [];
let collapsedCount = 0;
let autoRun = false;

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.options = [0, 1, 2, 3]; // All possible tiles
        this.collapsed = false;
        this.entropy = 4;
        this.scale = 1.0; // For animation
    }

    collapse() {
        if (this.options.length === 0) return false;
        const choice = this.options[Math.floor(Math.random() * this.options.length)];
        this.options = [choice];
        this.collapsed = true;
        this.entropy = 0;
        
        // Animation
        this.scale = 0.5;
        ANIM.add(300, (val) => {
            this.scale = val;
        }, Easing.easeOutElastic);
        
        return true;
    }
}

function init() {
    grid = [];
    collapsedCount = 0;
    autoRun = false;
    stack = [];
    
    for (let x = 0; x < GRID_SIZE; x++) {
        grid[x] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            grid[x][y] = new Cell(x, y);
        }
    }
    status.textContent = "Status: Ready";
    draw();
}

function getLowestEntropy() {
    let minEntropy = Infinity;
    let candidates = [];
    
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const cell = grid[x][y];
            if (!cell.collapsed) {
                if (cell.options.length < minEntropy) {
                    minEntropy = cell.options.length;
                    candidates = [cell];
                } else if (cell.options.length === minEntropy) {
                    candidates.push(cell);
                }
            }
        }
    }
    
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function propagate(startCell) {
    stack.push(startCell);
    
    while (stack.length > 0) {
        const current = stack.pop();
        const neighbors = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];

        neighbors.forEach(offset => {
            const nx = current.x + offset.dx;
            const ny = current.y + offset.dy;
            
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const neighbor = grid[nx][ny];
                if (!neighbor.collapsed) {
                    // Calculate valid options for neighbor based on current possible options
                    let possibleNeighborOptions = new Set();
                    
                    current.options.forEach(option => {
                        ADJACENCY[option].forEach(validNeighbor => {
                            possibleNeighborOptions.add(validNeighbor);
                        });
                    });
                    
                    // Filter neighbor options
                    const originalCount = neighbor.options.length;
                    neighbor.options = neighbor.options.filter(opt => possibleNeighborOptions.has(opt));
                    
                    if (neighbor.options.length === 0) {
                        // Contradiction! (Should handle backtrack, but simplified here)
                        console.warn("Contradiction at", nx, ny);
                        neighbor.collapsed = true; // Mark as dead end
                    } else if (neighbor.options.length < originalCount) {
                        stack.push(neighbor);
                        // Animate constraint update? (Maybe too noisy)
                    }
                }
            }
        });
    }
}

function step() {
    const cell = getLowestEntropy();
    if (!cell) {
        status.textContent = "Status: Complete!";
        autoRun = false;
        return;
    }
    
    cell.collapse();
    propagate(cell);
    collapsedCount++;
    draw();

    if (autoRun) {
        requestAnimationFrame(step);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const cell = grid[x][y];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (cell.collapsed) {
                // Collapsed: Solid color
                ctx.fillStyle = COLORS[cell.options[0]] || '#f00';
                
                // Animation logic
                const size = TILE_SIZE * (cell.scale || 1);
                const offset = (TILE_SIZE - size) / 2;
                
                ctx.fillRect(px + offset, py + offset, size, size);
            } else {
                // Entropy: Show possible colors as mini-dots
                ctx.fillStyle = '#111';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                
                const miniSize = TILE_SIZE / 2;
                cell.options.forEach((opt, i) => {
                    ctx.fillStyle = COLORS[opt];
                    // Lay them out in a 2x2 grid
                    const mx = (i % 2) * miniSize;
                    const my = Math.floor(i / 2) * miniSize;
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(px + mx + 2, py + my + 2, miniSize - 4, miniSize - 4);
                    ctx.globalAlpha = 1.0;
                });
            }
            ctx.strokeStyle = '#222';
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        }
    }
}

stepBtn.addEventListener('click', () => {
    autoRun = false;
    step();
});

autoBtn.addEventListener('click', () => {
    if (!autoRun) {
        autoRun = true;
        step();
    }
});

resetBtn.addEventListener('click', init);

init();
