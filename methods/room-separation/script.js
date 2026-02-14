const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const nextBtn = document.getElementById('nextBtn');
const stepLabel = document.getElementById('stepLabel');
const stepDesc = document.getElementById('stepDesc');

const WIDTH = 600;
const HEIGHT = 600;
const ROOM_COUNT = 60;
const MAIN_ROOM_THRESHOLD = 1.25; // Ratio of avg size

let rooms = [];
let currentStep = 'SPAWN';
let mstEdges = [];
let allEdges = [];

class Room {
    constructor() {
        this.reset();
    }

    reset() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 50;
        this.w = Math.floor(Math.random() * 40 + 20);
        this.h = Math.floor(Math.random() * 40 + 20);
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
}

function init() {
    rooms = [];
    for (let i = 0; i < ROOM_COUNT; i++) {
        rooms.push(new Room());
    }
    currentStep = 'SPAWN';
    mstEdges = [];
    allEdges = [];
    updateUI();
    draw();
}

function updateUI() {
    const steps = {
        'SPAWN': { label: 'Step: Initial Spawning', desc: 'Rooms are randomly placed within a circle.' },
        'SEPARATE': { label: 'Step: Separation', desc: 'Rooms push each other apart until they no longer overlap.' },
        'SELECT': { label: 'Step: Selecting Main Rooms', desc: 'Large rooms are chosen as the core nodes.' },
        'CONNECT': { label: 'Step: MST Connectivity', desc: 'Connecting main rooms using a Minimum Spanning Tree.' },
        'CORRIDORS': { label: 'Step: Corridors', desc: 'L-shaped corridors link the main rooms.' }
    };
    stepLabel.textContent = steps[currentStep].label;
    stepDesc.textContent = steps[currentStep].desc;
}

function separate() {
    let overlapping = true;
    let iterations = 0;
    while (overlapping && iterations < 100) {
        overlapping = false;
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
                    r1.vx += dx / dist;
                    r1.vy += dy / dist;
                }
            });
        });

        rooms.forEach(r => {
            r.x += r.vx;
            r.y += r.vy;
            // Snap to grid
            r.x = Math.round(r.x);
            r.y = Math.round(r.y);
        });
        iterations++;
    }
}

function selectMain() {
    const avgW = rooms.reduce((sum, r) => sum + r.w, 0) / rooms.length;
    const avgH = rooms.reduce((sum, r) => sum + r.h, 0) / rooms.length;
    rooms.forEach(r => {
        if (r.w > avgW * MAIN_ROOM_THRESHOLD && r.h > avgH * MAIN_ROOM_THRESHOLD) {
            r.isMain = true;
        }
    });
}

function connectRooms() {
    const mainRooms = rooms.filter(r => r.isMain);
    if (mainRooms.length < 2) return;

    // Build all possible edges (simplified Delaunay replacement)
    for (let i = 0; i < mainRooms.length; i++) {
        for (let j = i + 1; j < mainRooms.length; j++) {
            const r1 = mainRooms[i];
            const r2 = mainRooms[j];
            const dist = Math.sqrt(Math.pow(r1.centerX - r2.centerX, 2) + Math.pow(r1.centerY - r2.centerY, 2));
            allEdges.push({ u: i, v: j, weight: dist, r1, r2 });
        }
    }

    // Prim's algorithm for MST
    const visited = new Set([0]);
    const edges = [...allEdges];

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
            mstEdges.push(minEdge);
            visited.add(minEdge.u);
            visited.add(minEdge.v);
        } else break;
    }
    
    // Add 15% of other edges back to create loops
    allEdges.forEach(edge => {
        if (!mstEdges.includes(edge) && Math.random() < 0.15) {
            mstEdges.push(edge);
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Grid
    ctx.strokeStyle = '#111';
    for(let i=0; i<WIDTH; i+=20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, HEIGHT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WIDTH, i); ctx.stroke();
    }

    if (currentStep === 'CORRIDORS') {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        mstEdges.forEach(edge => {
            ctx.beginPath();
            ctx.moveTo(edge.r1.centerX, edge.r1.centerY);
            ctx.lineTo(edge.r1.centerX, edge.r2.centerY);
            ctx.lineTo(edge.r2.centerX, edge.r2.centerY);
            ctx.stroke();
        });
    }

    if (currentStep === 'CONNECT' || currentStep === 'CORRIDORS') {
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 1;
        mstEdges.forEach(edge => {
            ctx.beginPath();
            ctx.moveTo(edge.r1.centerX, edge.r1.centerY);
            ctx.lineTo(edge.r2.centerX, edge.r2.centerY);
            ctx.stroke();
        });
    }

    rooms.forEach(r => {
        if (currentStep === 'SPAWN' || currentStep === 'SEPARATE') {
            ctx.fillStyle = '#333';
            ctx.strokeStyle = '#555';
        } else {
            ctx.fillStyle = r.isMain ? '#fff' : '#222';
            ctx.strokeStyle = r.isMain ? '#4a90e2' : '#333';
        }
        
        if (currentStep === 'SELECT' && !r.isMain) {
            ctx.globalAlpha = 0.3;
        } else {
            ctx.globalAlpha = 1.0;
        }

        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
    });
    ctx.globalAlpha = 1.0;
}

nextBtn.addEventListener('click', () => {
    if (currentStep === 'SPAWN') currentStep = 'SEPARATE';
    else if (currentStep === 'SEPARATE') {
        separate();
        currentStep = 'SELECT';
    }
    else if (currentStep === 'SELECT') {
        selectMain();
        currentStep = 'CONNECT';
    }
    else if (currentStep === 'CONNECT') {
        connectRooms();
        currentStep = 'CORRIDORS';
    }
    else {
        init();
        return;
    }
    updateUI();
    draw();
});

resetBtn.addEventListener('click', init);

init();
