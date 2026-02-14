const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const flyBtn = document.getElementById('flyBtn');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdVal = document.getElementById('thresholdVal');

const SCALE = 20; // Lower = "zoomed in"
const GRID_SIZE = 40;
const TILE_SIZE = 10;

let flying = false;
let zOff = 0;
let flySpeed = 0.05;
let threshold = 0.45;

// === Simplex/Perlin Noise Implementation (Simplified) ===
// A tiny implementation for the sake of no dependencies
const Permutation = [];
for (let i = 0; i < 256; i++) Permutation[i] = Math.floor(Math.random() * 256);
const P = [...Permutation, ...Permutation];

function dot(g, x, y) {
    return g[0] * x + g[1] * y;
}

const GRAD3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
               [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
               [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];

function noise2D(xin, yin) {
    let n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const s = (xin + yin) * F2; // Hairy factor for 2D
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const t = (i + j) * G2;
    const X0 = i - t; // Unskew the cell origin back to (x,y) space
    const Y0 = j - t;
    const x0 = xin - X0; // The x,y distances from the cell origin
    const y0 = yin - Y0;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) { i1 = 1; j1 = 0; } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
    else { i1 = 0; j1 = 1; }      // upper triangle, YX order: (0,0)->(0,1)->(1,1)
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
    const y2 = y0 - 1.0 + 2.0 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = P[ii + P[jj]] % 12;
    const gi1 = P[ii + i1 + P[jj + j1]] % 12;
    const gi2 = P[ii + 1 + P[jj + 1]] % 12;
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0.0;
    else {
        t0 *= t0;
        n0 = t0 * t0 * dot(GRAD3[gi0], x0, y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0.0;
    else {
        t1 *= t1;
        n1 = t1 * t1 * dot(GRAD3[gi1], x1, y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0.0;
    else {
        t2 *= t2;
        n2 = t2 * t2 * dot(GRAD3[gi2], x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2);
}

// === End Noise Implementation ===

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid based on noise
    for (let x = 0; x < canvas.width; x+=TILE_SIZE) {
        for (let y = 0; y < canvas.height; y+=TILE_SIZE) {
            // Map x, y to noise space
            // zOff adds the "flying" effect (changing time)
            const nx = x / (SCALE * 10);
            const ny = y / (SCALE * 10);
            
            // Add octaves for detail? Just simple noise for now
            let val = (noise2D(nx + zOff, ny + zOff) + 1) / 2; // Normalize -1..1 to 0..1
            
            if (val > threshold) {
                ctx.fillStyle = '#fff'; // Wall
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#222'; // Floor
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    
    if (flying) {
        zOff += flySpeed;
        requestAnimationFrame(draw);
    }
}

thresholdSlider.addEventListener('input', (e) => {
    threshold = parseFloat(e.target.value);
    thresholdVal.textContent = threshold;
    if (!flying) draw();
});

flyBtn.addEventListener('click', () => {
    flying = !flying;
    flyBtn.textContent = flying ? "Stop Flying" : "Start Flying";
    if (flying) draw();
});

draw();
