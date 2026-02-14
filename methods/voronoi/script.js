const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const relaxBtn = document.getElementById('relaxBtn');

const WIDTH = 400;
const HEIGHT = 400;
let sites = [];

class Site {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
    }
}

function init() {
    sites = [];
    for(let i=0; i<10; i++) {
        sites.push(new Site(Math.random() * WIDTH, Math.random() * HEIGHT));
    }
    draw();
}

// Compute Voronoi regions (Brute force per pixel for simplicity/visual clarity)
// In a real game, use Fortune's Algorithm or a shader
function draw() {
    const imageData = ctx.createImageData(WIDTH, HEIGHT);
    const data = imageData.data;

    for (let x = 0; x < WIDTH; x++) {
        for (let y = 0; y < HEIGHT; y++) {
            let closestDist = Infinity;
            let closestSite = null;

            // Find closest site
            for (let s of sites) {
                const dx = x - s.x;
                const dy = y - s.y;
                const d = dx*dx + dy*dy; // Squared distance is faster
                if (d < closestDist) {
                    closestDist = d;
                    closestSite = s;
                }
            }

            // Set pixel color
            const index = (y * WIDTH + x) * 4;
            // Parse HSL to RGB (simplified approximation for speed or just use canvas fillRect for high res)
            // Actually, let's use canvas fillRect on 2x2 blocks for speed in JS
        }
    }
    
    // Better Approach for JS: 
    // Loop pixels is slow in JS. Let's use a lower resolution grid or just optimize.
    // Actually, let's stick to the pixel manipulation but do it properly.
    
    // To parse HSL string to RGB is annoying. Let's pre-calculate RGB for sites.
}

// Re-writing draw to be performant
function drawFast() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Create an offscreen buffer for pixel manipulation?
    // Or just iterate 4x4 blocks
    const BLOCK = 4;
    for (let x = 0; x < WIDTH; x += BLOCK) {
        for (let y = 0; y < HEIGHT; y += BLOCK) {
            let closestDist = Infinity;
            let closestSite = null;

            for (let s of sites) {
                const dx = (x + BLOCK/2) - s.x;
                const dy = (y + BLOCK/2) - s.y;
                const d = dx*dx + dy*dy;
                if (d < closestDist) {
                    closestDist = d;
                    closestSite = s;
                }
            }
            
            ctx.fillStyle = closestSite.color;
            ctx.fillRect(x, y, BLOCK, BLOCK);
        }
    }

    // Draw sites
    sites.forEach(s => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    });
}

// Lloyd's Relaxation: Move sites to the centroid of their region
function relax() {
    // 1. Calculate centroids
    const centroids = sites.map(() => ({ x: 0, y: 0, count: 0 }));
    const BLOCK = 2; // Higher res for relaxation
    
    for (let x = 0; x < WIDTH; x += BLOCK) {
        for (let y = 0; y < HEIGHT; y += BLOCK) {
            let closestDist = Infinity;
            let closestIndex = -1;

            sites.forEach((s, i) => {
                const dx = x - s.x;
                const dy = y - s.y;
                const d = dx*dx + dy*dy;
                if (d < closestDist) {
                    closestDist = d;
                    closestIndex = i;
                }
            });

            if (closestIndex !== -1) {
                centroids[closestIndex].x += x;
                centroids[closestIndex].y += y;
                centroids[closestIndex].count++;
            }
        }
    }

    // 2. Move sites
    sites.forEach((s, i) => {
        const c = centroids[i];
        if (c.count > 0) {
            // Animate to new position
            const tx = c.x / c.count;
            const ty = c.y / c.count;
            
            // Simple lerp animation frame by frame would be nice, but here we just step
            s.x += (tx - s.x) * 0.5;
            s.y += (ty - s.y) * 0.5;
        }
    });
    
    drawFast();
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    sites.push(new Site(x, y));
    drawFast();
});

resetBtn.addEventListener('click', init);
relaxBtn.addEventListener('click', relax);

init();
drawFast();
