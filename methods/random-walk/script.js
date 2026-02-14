const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const generateBtn = document.getElementById('generateBtn');
const fillCountDisplay = document.getElementById('fillCount');

const GRID_SIZE = 40;
const TILE_SIZE = 10;
const FILL_PERCENT = 0.4;

let grid = [];

function initGrid() {
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            ctx.fillStyle = grid[x][y] === 1 ? '#fff' : '#222';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

function generate() {
    initGrid();
    let x = Math.floor(GRID_SIZE / 2);
    let y = Math.floor(GRID_SIZE / 2);
    let floors = 0;
    const targetFloors = (GRID_SIZE * GRID_SIZE) * FILL_PERCENT;

    while (floors < targetFloors) {
        if (grid[x][y] === 0) {
            grid[x][y] = 1;
            floors++;
        }

        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const dir = directions[Math.floor(Math.random() * 4)];
        
        const nx = x + dir[0];
        const ny = y + dir[1];

        // Keep within bounds
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            x = nx;
            y = ny;
        }
    }

    fillCountDisplay.textContent = Math.round((floors / (GRID_SIZE * GRID_SIZE)) * 100);
    draw();
}

generateBtn.addEventListener('click', generate);
generate();
