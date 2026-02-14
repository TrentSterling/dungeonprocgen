const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const nextBtn = document.getElementById('nextBtn');
const stepLabel = document.getElementById('stepLabel');
const stepDesc = document.getElementById('stepDesc');

const WIDTH = 600;
const HEIGHT = 600;
const ROOM_COUNT = 60;
const MAIN_ROOM_THRESHOLD = 1.25;

let rooms = [];
let currentStep = 'INIT';
let mstEdges = [];
let allEdges = [];
let separating = false;

// Initialize the shared Animator from utils.js (assumed loaded globally)
const anim = new Animator();

class Room {
    constructor() {
        this.reset();
        this.scale = 0; // For spawn animation
        this.color = '#333';
        this.borderColor = '#555';
    }

    reset() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 50;
        this.targetW = Math.floor(Math.random() * 40 + 20);
        this.targetH = Math.floor(Math.random() * 40 + 20);
        this.w = this.targetW;
        this.h = this.targetH;
        this.x = WIDTH / 2 + Math.cos(angle) * radius - this.w / 2;
        this.y = HEIGHT / 2 + Math.sin(angle) * radius - this.h / 2;
        this.vx = 0;
        this.vy = 0;
        this.isMain = false;
    }

    get centerX() { return this.x + this.w / 2; }
    get centerY() { return this.y + this.h / 2; }

    intersects(other) {
        return !(this.x > other.x + other.w ||
                 this.x + this.w < other.x ||
                 this.y > other.y + other.h ||
                 this.y + this.h < other.y);
    }

    draw(ctx) {
        const cx = this.x + this.w/2;
        const cy = this.y + this.h/2;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-cx, -cy);
        
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 2;
        
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        
        ctx.restore();
    }
}

function init() {
    rooms = [];
    mstEdges = [];
    allEdges = [];
    separating = false;
    
    // Create rooms but keep them hidden initially
    for (let i = 0; i < ROOM_COUNT; i++) {
        rooms.push(new Room());
    }
    
    currentStep = 'SPAWN';
    updateUI();

    // Animate Spawning
    rooms.forEach((r, i) => {
        setTimeout(() => {
            anim.add(600, (val) => {
                r.scale = val;
            }, Easing.easeOutElastic);
        }, i * 30);
    });
}

function updateUI() {
    const steps = {
        'SPAWN': { label: 'Step: Initial Spawning', desc: 'Rooms pop into existence in a chaotic cluster.' },
        'SEPARATE': { label: 'Step: Separation', desc: 'Physics simulation pushes overlapping rooms apart.' },
        'SELECT': { label: 'Step: Selecting Main Rooms', desc: 'Identifying the largest rooms to form the dungeon backbone.' },
        'CONNECT': { label: 'Step: MST Connectivity', desc: 'Connecting main rooms with a Minimum Spanning Tree.' },
        'CORRIDORS': { label: 'Step: Corridors', desc: 'Generating hallways from the connections.' }
    };
    if(steps[currentStep]) {
        stepLabel.textContent = steps[currentStep].label;
        stepDesc.textContent = steps[currentStep].desc;
    }
}

function startSeparation() {
    separating = true;
    currentStep = 'SEPARATE';
    updateUI();
}

function physicsLoop() {
    if (!separating) return;

    let overlapping = false;
    rooms.forEach(r1 => {
        r1.vx = 0;
        r1.vy = 0;
        rooms.forEach(r2 => {
            if (r1 === r2) return;
            if (r1.intersects(r2)) {
                overlapping = true;
                let dx = r1.centerX - r2.centerX;
                let dy = r1.centerY - r2.centerY;
                if (dx === 0 && dy === 0) {
                    dx = Math.random() - 0.5;
                    dy = Math.random() - 0.5;
                }
                const dist = Math.sqrt(dx*dx + dy*dy);
                // Stronger push
                const force = 1.5;
                r1.vx += (dx / dist) * force;
                r1.vy += (dy / dist) * force;
            }
        });
    });

    rooms.forEach(r => {
        r.x += r.vx;
        r.y += r.vy;
    });

    if (!overlapping) {
        separating = false;
        // Snap to grid after physics settles
        rooms.forEach(r => {
            r.x = Math.round(r.x);
            r.y = Math.round(r.y);
        });
        currentStep = 'SELECT'; // Ready for next step
        updateUI();
    }
}

function selectMain() {
    currentStep = 'SELECT';
    updateUI();
    const avgW = rooms.reduce((sum, r) => sum + r.w, 0) / rooms.length;
    const avgH = rooms.reduce((sum, r) => sum + r.h, 0) / rooms.length;
    
    rooms.forEach((r, i) => {
        if (r.w > avgW * MAIN_ROOM_THRESHOLD && r.h > avgH * MAIN_ROOM_THRESHOLD) {
            r.isMain = true;
            // Animate highlight
            setTimeout(() => {
                anim.add(500, (val) => {
                    // Interpolate color from #333 to #eee
                    // Simplified: just swapping for now, but could be fancier
                }, Easing.easeOutQuad, () => {
                   r.color = '#eee';
                   r.borderColor = '#4a90e2';
                });
            }, i * 50);
        } else {
            // Fade out non-main rooms slightly
            anim.add(500, (val) => {
                // opacity handled in draw
            });
        }
    });
}

function connectRooms() {
    currentStep = 'CONNECT';
    updateUI();
    
    const mainRooms = rooms.filter(r => r.isMain);
    if (mainRooms.length < 2) return;

    // Calculate all edges
    allEdges = [];
    for (let i = 0; i < mainRooms.length; i++) {
        for (let j = i + 1; j < mainRooms.length; j++) {
            const r1 = mainRooms[i];
            const r2 = mainRooms[j];
            const dist = Math.sqrt(Math.pow(r1.centerX - r2.centerX, 2) + Math.pow(r1.centerY - r2.centerY, 2));
            allEdges.push({ u: i, v: j, weight: dist, r1, r2 });
        }
    }

    // Prim's
    const visited = new Set([0]);
    const edges = [...allEdges];
    mstEdges = [];

    while (visited.size < mainRooms.length) {
        let minEdge = null;
        let minWeight = Infinity;
        
        edges.forEach(edge => {
            const hasU = visited.has(edge.u);
            const hasV = visited.has(edge.v);
            if ((hasU && !hasV) || (!hasU && hasV)) {
                if (edge.weight < minWeight) {
                    minWeight = edge.weight;
                    minEdge = edge;
                }
            }
        });

        if (minEdge) {
            mstEdges.push({ ...minEdge, progress: 0 });
            visited.add(minEdge.u);
            visited.add(minEdge.v);
        } else break;
    }

    // Add loops
    allEdges.forEach(edge => {
        // Check if edge already exists in mstEdges (by reference to original objects)
        const exists = mstEdges.some(e => e.r1 === edge.r1 && e.r2 === edge.r2);
        if (!exists && Math.random() < 0.15) {
            mstEdges.push({ ...edge, progress: 0 });
        }
    });

    // Animate edges drawing one by one
    mstEdges.forEach((edge, i) => {
        setTimeout(() => {
            anim.add(400, (val) => {
                edge.progress = val;
            }, Easing.easeInOutQuad);
        }, i * 100);
    });
}

function makeCorridors() {
    currentStep = 'CORRIDORS';
    updateUI();
    // No specific animation for corridors yet, just draw them L-shaped
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Grid background
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for(let i=0; i<WIDTH; i+=40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, HEIGHT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WIDTH, i); ctx.stroke();
    }

    // Draw MST connections
    if (currentStep === 'CONNECT' || currentStep === 'CORRIDORS') {
        mstEdges.forEach(edge => {
            if (edge.progress > 0) {
                ctx.strokeStyle = '#4a90e2';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(edge.r1.centerX, edge.r1.centerY);
                
                // Lerp target
                const tx = edge.r1.centerX + (edge.r2.centerX - edge.r1.centerX) * edge.progress;
                const ty = edge.r1.centerY + (edge.r2.centerY - edge.r1.centerY) * edge.progress;
                
                ctx.lineTo(tx, ty);
                ctx.stroke();
            }
        });
    }

    // Draw Corridors (L-shape)
    if (currentStep === 'CORRIDORS') {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        mstEdges.forEach(edge => {
             // Simple L-shape: Horizontal then Vertical
             const midX = edge.r2.centerX;
             const midY = edge.r1.centerY;
             
             ctx.beginPath();
             ctx.moveTo(edge.r1.centerX, edge.r1.centerY);
             ctx.lineTo(midX, midY);
             ctx.lineTo(edge.r2.centerX, edge.r2.centerY);
             ctx.stroke();
        });
    }

    // Draw Rooms
    rooms.forEach(r => {
        if (currentStep === 'SELECT' || currentStep === 'CONNECT' || currentStep === 'CORRIDORS') {
            if (!r.isMain) ctx.globalAlpha = 0.2;
        }
        r.draw(ctx);
        ctx.globalAlpha = 1.0;
    });

    physicsLoop();
    requestAnimationFrame(draw);
}

nextBtn.addEventListener('click', () => {
    if (currentStep === 'SPAWN') startSeparation();
    else if (currentStep === 'SEPARATE' && !separating) selectMain(); // Only proceed if settled
    else if (currentStep === 'SELECT') connectRooms();
    else if (currentStep === 'CONNECT') makeCorridors();
    else if (currentStep === 'CORRIDORS') init();
});

resetBtn.addEventListener('click', init);

// Start loop
init();
draw();
