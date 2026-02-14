const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const nextBtn = document.getElementById('nextBtn');
const stepLabel = document.getElementById('stepLabel');
const stepDesc = document.getElementById('stepDesc');

const WIDTH = 600;
const HEIGHT = 600;
const ROOM_COUNT = 80;
const MAIN_ROOM_THRESHOLD = 1.2;

let rooms = [];
let currentStep = 'SPAWN';
let mstEdges = [];
let triEdges = []; 
let separating = false;

const anim = new Animator();

class Room {
    constructor() {
        this.reset();
        this.scale = 0;
        this.color = '#333';
        this.borderColor = '#555';
        this.opacity = 1.0;
    }

    reset() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 60;
        this.w = Math.floor(Math.random() * 30 + 15);
        this.h = Math.floor(Math.random() * 30 + 15);
        this.w = Math.round(this.w / 10) * 10;
        this.h = Math.round(this.h / 10) * 10;
        
        this.x = WIDTH / 2 + Math.cos(angle) * radius - this.w / 2;
        this.y = HEIGHT / 2 + Math.sin(angle) * radius - this.h / 2;
        this.vx = 0;
        this.vy = 0;
        this.isMain = false;
    }

    get centerX() { return this.x + this.w / 2; }
    get centerY() { return this.y + this.h / 2; }

    intersects(other) {
        return !(this.x >= other.x + other.w + 2 ||
                 this.x + this.w + 2 <= other.x ||
                 this.y >= other.y + other.h + 2 ||
                 this.y + this.h + 2 <= other.y);
    }

    draw(ctx) {
        const cx = this.x + this.w/2;
        const cy = this.y + this.h/2;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(cx, cy);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-cx, -cy);
        
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 1;
        
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        
        ctx.restore();
    }
}

function init() {
    rooms = [];
    mstEdges = [];
    triEdges = [];
    separating = false;
    currentStep = 'SPAWN';
    updateUI();

    for (let i = 0; i < ROOM_COUNT; i++) {
        rooms.push(new Room());
    }

    rooms.forEach((r, i) => {
        setTimeout(() => {
            anim.add(500, (val) => {
                r.scale = val;
            }, Easing.easeOutElastic);
        }, i * 15);
    });
}

function updateUI() {
    const steps = {
        'SPAWN': { label: 'Step 1: Spawning', desc: 'Rooms are scattered in a tight bunch.' },
        'SEPARATE': { label: 'Step 2: Separation', desc: 'Pushing rooms apart using steering behaviors.' },
        'SELECT': { label: 'Step 3: Main Rooms', desc: 'Large rooms are selected; others become potential corridor paths.' },
        'TRIANGULATE': { label: 'Step 4: Triangulation', desc: 'Generating all possible connections between main rooms.' },
        'MST': { label: 'Step 5: Spanning Tree', desc: 'Trimming the graph to a Minimum Spanning Tree (MST).' },
        'CORRIDORS': { label: 'Step 6: Corridors', desc: 'Finalizing the layout with L-shaped hallways.' }
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

    for (let i = 0; i < 3; i++) {
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
                    r1.vx += (dx / dist) * 1.5;
                    r1.vy += (dy / dist) * 1.5;
                }
            });
        });

        rooms.forEach(r => {
            r.x += r.vx;
            r.y += r.vy;
        });

        if (!overlapping) {
            finishSeparation();
            break;
        }
    }
}

function finishSeparation() {
    separating = false;
    rooms.forEach(r => {
        r.x = Math.round(r.x / 10) * 10;
        r.y = Math.round(r.y / 10) * 10;
    });
    updateUI();
}

function fastForwardPhysics() {
    let safeguard = 0;
    while (separating && safeguard < 2000) {
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
                    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    r1.vx += (dx / dist) * 1.5;
                    r1.vy += (dy / dist) * 1.5;
                }
            });
        });
        rooms.forEach(r => {
            r.x += r.vx;
            r.y += r.vy;
        });
        if (!overlapping) separating = false;
        safeguard++;
    }
    finishSeparation();
}

function selectMain() {
    currentStep = 'SELECT';
    updateUI();
    const avgW = rooms.reduce((sum, r) => sum + r.w, 0) / rooms.length;
    const avgH = rooms.reduce((sum, r) => sum + r.h, 0) / rooms.length;
    
    rooms.forEach((r, i) => {
        if (r.w > avgW * MAIN_ROOM_THRESHOLD && r.h > avgH * MAIN_ROOM_THRESHOLD) {
            r.isMain = true;
            r.color = '#fff';
            r.borderColor = '#4a90e2';
        } else {
            anim.add(800, (val) => {
                r.opacity = 1.0 - (val * 0.8);
            }, Easing.easeOutQuad);
        }
    });
}

function triangulate() {
    currentStep = 'TRIANGULATE';
    updateUI();
    const mainRooms = rooms.filter(r => r.isMain);
    triEdges = [];
    
    for(let i=0; i<mainRooms.length; i++) {
        for(let j=i+1; j<mainRooms.length; j++) {
            const r1 = mainRooms[i];
            const r2 = mainRooms[j];
            const d = Math.sqrt(Math.pow(r1.centerX - r2.centerX, 2) + Math.pow(r1.centerY - r2.centerY, 2));
            // Only add edges below a certain length to simulate a graph that isn't fully connected but plausible
            if (d < 250) {
                triEdges.push({ r1, r2, progress: 0 });
            }
        }
    }

    triEdges.forEach((e, i) => {
        setTimeout(() => {
            anim.add(500, (v) => e.progress = v, Easing.easeOutQuad);
        }, i * 10);
    });
}

function calculateMST() {
    currentStep = 'MST';
    updateUI();
    const mainRooms = rooms.filter(r => r.isMain);
    if (mainRooms.length === 0) return;

    mstEdges = [];
    const visited = new Set([mainRooms[0]]);
    const unvisited = new Set(mainRooms.slice(1));

    while (unvisited.size > 0) {
        let bestEdge = null;
        let minDist = Infinity;
        
        for (let r1 of visited) {
            for (let r2 of unvisited) {
                const d = Math.sqrt(Math.pow(r1.centerX - r2.centerX, 2) + Math.pow(r1.centerY - r2.centerY, 2));
                if (d < minDist) {
                    minDist = d;
                    bestEdge = { r1, r2 };
                }
            }
        }

        if (bestEdge) {
            const edge = { ...bestEdge, progress: 0 };
            mstEdges.push(edge);
            visited.add(bestEdge.r2);
            unvisited.delete(bestEdge.r2);
            
            anim.add(600, (v) => edge.progress = v, Easing.easeInOutQuad);
        } else break;
    }

    // Add back 15% of other triEdges for loops
    triEdges.forEach(e => {
        const alreadyIn = mstEdges.find(me => (me.r1 === e.r1 && me.r2 === e.r2) || (me.r1 === e.r2 && me.r2 === e.r1));
        if(!alreadyIn && Math.random() < 0.1) {
            const loopEdge = { ...e, progress: 0 };
            mstEdges.push(loopEdge);
            anim.add(600, (v) => loopEdge.progress = v, Easing.easeInOutQuad);
        }
    });
}

function makeCorridors() {
    currentStep = 'CORRIDORS';
    updateUI();
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Background Grid
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for(let i=0; i<WIDTH; i+=20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, HEIGHT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WIDTH, i); ctx.stroke();
    }

    // 1. Draw ALL possible connections (faintly) once we've reached triangulation
    if (['TRIANGULATE', 'MST', 'CORRIDORS'].includes(currentStep)) {
        ctx.strokeStyle = 'rgba(74, 144, 226, 0.25)';
        ctx.lineWidth = 2;
        triEdges.forEach(e => {
            if (e.progress > 0) {
                ctx.beginPath();
                ctx.moveTo(e.r1.centerX, e.r1.centerY);
                ctx.lineTo(e.r1.centerX + (e.r2.centerX - e.r1.centerX) * e.progress, e.r1.centerY + (e.r2.centerY - e.r1.centerY) * e.progress);
                ctx.stroke();
            }
        });
    }

    // 2. Draw MST connections (Solid blue)
    if (['MST', 'CORRIDORS'].includes(currentStep)) {
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 4;
        mstEdges.forEach(e => {
            if (e.progress > 0) {
                ctx.beginPath();
                ctx.moveTo(e.r1.centerX, e.r1.centerY);
                ctx.lineTo(e.r1.centerX + (e.r2.centerX - e.r1.centerX) * e.progress, e.r1.centerY + (e.r2.centerY - e.r1.centerY) * e.progress);
                ctx.stroke();
            }
        });
    }

    // 3. Draw Corridors (Thick white L-shapes)
    if (currentStep === 'CORRIDORS') {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 6;
        mstEdges.forEach(e => {
            ctx.beginPath();
            ctx.moveTo(e.r1.centerX, e.r1.centerY);
            ctx.lineTo(e.r2.centerX, e.r1.centerY);
            ctx.lineTo(e.r2.centerX, e.r2.centerY);
            ctx.stroke();
        });
    }

    // 4. Draw Rooms on top
    rooms.forEach(r => r.draw(ctx));

    physicsLoop();
    requestAnimationFrame(draw);
}

nextBtn.addEventListener('click', () => {
    if (currentStep === 'SPAWN') startSeparation();
    else if (currentStep === 'SEPARATE') {
        if (separating) fastForwardPhysics();
        else selectMain();
    } else if (currentStep === 'SELECT') triangulate();
    else if (currentStep === 'TRIANGULATE') calculateMST();
    else if (currentStep === 'MST') makeCorridors();
    else if (currentStep === 'CORRIDORS') init();
    updateUI();
});

resetBtn.addEventListener('click', init);

init();
draw();
