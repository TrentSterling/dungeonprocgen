const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const stepBtn = document.getElementById('stepBtn');
const iterCountDisplay = document.getElementById('iterCount');

const GRID_SIZE = 50;
const TILE_SIZE = 8;
const INITIAL_WALL_CHANCE = 0.45;

let grid = [];
let iteration = 0;

function initGrid() {
    iteration = 0;
    iterCountDisplay.textContent = iteration;
    grid = Array(GRID_SIZE).fill().map(() => 
        Array(GRID_SIZE).fill().map(() => Math.random() < INITIAL_WALL_CHANCE ? 1 : 0)
    );
    // Borders should be walls
    for(let i=0; i<GRID_SIZE; i++) {
        grid[i][0] = 1;
        grid[i][GRID_SIZE-1] = 1;
        grid[0][i] = 1;
        grid[GRID_SIZE-1][i] = 1;
    }
    draw();
}

function countNeighbors(x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const nx = x + i;
            const ny = y + j;
            if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) {
                count++; // Out of bounds counts as wall
            } else if (grid[nx][ny] === 1) {
                count++;
            }
        }
    }
    return count;
}

function step() {
    const newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const neighbors = countNeighbors(x, y);
            if (neighbors > 4) {
                newGrid[x][y] = 1;
            } else if (neighbors < 4) {
                newGrid[x][y] = 0;
            } else {
                newGrid[x][y] = grid[x][y];
            }
        }
    }
    grid = newGrid;
    iteration++;
    iterCountDisplay.textContent = iteration;
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            ctx.fillStyle = grid[x][y] === 1 ? '#444' : '#fff';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

resetBtn.addEventListener('click', initGrid);
stepBtn.addEventListener('click', step);

initGrid();
