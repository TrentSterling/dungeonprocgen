const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const radiusSlider = document.getElementById('radiusSlider');

const WIDTH = 400;
const HEIGHT = 400;
let r = 30;
const k = 30; // Rejection limit

let grid = [];
let w = 0;
let cols, rows;
let active = [];
let ordered = [];

function init() {
    r = parseInt(radiusSlider.value);
    w = r / Math.sqrt(2);
    
    cols = Math.floor(WIDTH / w);
    rows = Math.floor(HEIGHT / w);
    grid = new Array(cols * rows).fill(undefined);
    active = [];
    ordered = [];
    
    // Starting point
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    const i = Math.floor(x / w);
    const j = Math.floor(y / w);
    const pos = {x, y};
    
    grid[i + j * cols] = pos;
    active.push(pos);
    ordered.push(pos);
    
    step();
}

function step() {
    if (active.length > 0) {
        const randIndex = Math.floor(Math.random() * active.length);
        const pos = active[randIndex];
        let found = false;
        
        for (let n = 0; n < k; n++) {
            const angle = Math.random() * Math.PI * 2;
            const m = Math.random() * r + r; // Distance between r and 2r
            const sample = {
                x: pos.x + Math.cos(angle) * m,
                y: pos.y + Math.sin(angle) * m
            };
            
            const col = Math.floor(sample.x / w);
            const row = Math.floor(sample.y / w);
            
            if (col >= 0 && row >= 0 && col < cols && row < rows && !grid[col + row * cols]) {
                let ok = true;
                // Check neighbors
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const neighborIndex = (col + i) + (row + j) * cols;
                        const neighbor = grid[neighborIndex];
                        if (neighbor) {
                            const d = Math.sqrt((sample.x - neighbor.x)**2 + (sample.y - neighbor.y)**2);
                            if (d < r) {
                                ok = false;
                            }
                        }
                    }
                }
                
                if (ok) {
                    found = true;
                    grid[col + row * cols] = sample;
                    active.push(sample);
                    ordered.push(sample);
                    break;
                }
            }
        }
        
        if (!found) {
            active.splice(randIndex, 1);
        }
        
        requestAnimationFrame(step);
    }
    draw();
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Draw grid lines (optional)
    /*
    ctx.strokeStyle = '#222';
    for (let i = 0; i < cols; i++) {
        ctx.beginPath(); ctx.moveTo(i * w, 0); ctx.lineTo(i * w, HEIGHT); ctx.stroke();
    }
    for (let j = 0; j < rows; j++) {
        ctx.beginPath(); ctx.moveTo(0, j * w); ctx.lineTo(WIDTH, j * w); ctx.stroke();
    }
    */

    ordered.forEach(p => {
        ctx.fillStyle = '#4a90e2';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    active.forEach(p => {
        ctx.fillStyle = '#ff4081';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

resetBtn.addEventListener('click', init);
radiusSlider.addEventListener('input', init);

init();
