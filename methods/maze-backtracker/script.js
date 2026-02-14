const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const speedBtn = document.getElementById('speedBtn');

const COLS = 20;
const ROWS = 20;
const CELL_SIZE = 20;

let grid = [];
let stack = [];
let current;
let speed = 50; // Delay in ms

class Cell {
    constructor(c, r) {
        this.c = c;
        this.r = r;
        this.walls = [true, true, true, true]; // Top, Right, Bottom, Left
        this.visited = false;
    }

    checkNeighbors() {
        let neighbors = [];
        
        let top = grid[index(this.c, this.r - 1)];
        let right = grid[index(this.c + 1, this.r)];
        let bottom = grid[index(this.c, this.r + 1)];
        let left = grid[index(this.c - 1, this.r)];

        if (top && !top.visited) neighbors.push(top);
        if (right && !right.visited) neighbors.push(right);
        if (bottom && !bottom.visited) neighbors.push(bottom);
        if (left && !left.visited) neighbors.push(left);

        if (neighbors.length > 0) {
            let r = Math.floor(Math.random() * neighbors.length);
            return neighbors[r];
        } else {
            return undefined;
        }
    }

    show() {
        let x = this.c * CELL_SIZE;
        let y = this.r * CELL_SIZE;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        if (this.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL_SIZE, y); ctx.stroke(); }
        if (this.walls[1]) { ctx.beginPath(); ctx.moveTo(x + CELL_SIZE, y); ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE); ctx.stroke(); }
        if (this.walls[2]) { ctx.beginPath(); ctx.moveTo(x + CELL_SIZE, y + CELL_SIZE); ctx.lineTo(x, y + CELL_SIZE); ctx.stroke(); }
        if (this.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y + CELL_SIZE); ctx.lineTo(x, y); ctx.stroke(); }

        if (this.visited) {
            ctx.fillStyle = '#222'; // Visited color
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }
    
    highlight() {
        let x = this.c * CELL_SIZE;
        let y = this.r * CELL_SIZE;
        ctx.fillStyle = '#4a90e2'; // Head color
        ctx.fillRect(x+4, y+4, CELL_SIZE-8, CELL_SIZE-8);
    }
}

function index(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return -1;
    return c + r * COLS;
}

function removeWalls(a, b) {
    let x = a.c - b.c;
    if (x === 1) {
        a.walls[3] = false;
        b.walls[1] = false;
    } else if (x === -1) {
        a.walls[1] = false;
        b.walls[3] = false;
    }
    let y = a.r - b.r;
    if (y === 1) {
        a.walls[0] = false;
        b.walls[2] = false;
    } else if (y === -1) {
        a.walls[2] = false;
        b.walls[0] = false;
    }
}

function init() {
    grid = [];
    stack = [];
    for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
            grid.push(new Cell(i, j));
        }
    }
    current = grid[0];
    draw();
}

function draw() {
    // Clear whole canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < grid.length; i++) {
        grid[i].show();
    }
    
    if (current) {
        current.visited = true;
        current.highlight();
        
        // Step logic
        let next = current.checkNeighbors();
        if (next) {
            next.visited = true;
            stack.push(current);
            removeWalls(current, next);
            current = next;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            // Finished
            current = undefined;
        }
    }
    
    if (current) {
        setTimeout(() => requestAnimationFrame(draw), speed);
    } else {
        // One last draw to clear the highlight
        for (let i = 0; i < grid.length; i++) {
            grid[i].show();
        }
    }
}

resetBtn.addEventListener('click', init);
speedBtn.addEventListener('click', () => {
    if (speed === 50) { speed = 10; speedBtn.textContent = "Speed: Fast"; }
    else { speed = 50; speedBtn.textContent = "Speed: Normal"; }
});

init();
