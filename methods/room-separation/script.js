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

    // Run multiple iterations per frame to speed up settling naturally
    for (let i = 0; i < 2; i++) {
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
            finishSeparation();
            break;
        }
    }
}

function finishSeparation() {
    separating = false;
    rooms.forEach(r => {
        r.x = Math.round(r.x);
        r.y = Math.round(r.y);
    });
    // Don't auto-advance currentStep, wait for Next button
    updateUI();
}

function fastForwardPhysics() {
    let overlapping = true;
    let safeguard = 0;
    while (overlapping && safeguard < 2000) {
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
        safeguard++;
    }
    finishSeparation();
}

nextBtn.addEventListener('click', () => {
    if (currentStep === 'SPAWN') {
        startSeparation();
    } else if (currentStep === 'SEPARATE') {
        if (separating) {
            fastForwardPhysics();
        } else {
            currentStep = 'SELECT';
            selectMain();
        }
    } else if (currentStep === 'SELECT') {
        currentStep = 'CONNECT';
        connectRooms();
    } else if (currentStep === 'CONNECT') {
        currentStep = 'CORRIDORS';
        makeCorridors();
    } else if (currentStep === 'CORRIDORS') {
        init();
    }
    updateUI();
});

resetBtn.addEventListener('click', init);

// Start loop
init();
draw();
