const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const growBtn = document.getElementById('growBtn');

const WIDTH = 400;
const HEIGHT = 400;
const MAX_DIST = 100;
const MIN_DIST = 10;
const ATTRACTOR_COUNT = 200;

let attractors = [];
let tree = [];

class Node {
    constructor(x, y, parent) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.dir = { x: 0, y: 0 };
        this.count = 0;
    }
}

function init() {
    attractors = [];
    tree = [];
    
    // Scatter attractors
    for (let i = 0; i < ATTRACTOR_COUNT; i++) {
        attractors.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT - 100 // Keep top clearish
        });
    }

    // Root
    tree.push(new Node(WIDTH / 2, HEIGHT, null));
    draw();
}

function grow() {
    // 1. Associate attractors with closest node
    // Reset dirs
    tree.forEach(n => {
        n.dir = { x: 0, y: 0 };
        n.count = 0;
    });

    attractors.forEach(a => {
        let closestNode = null;
        let record = MAX_DIST;
        
        tree.forEach(n => {
            const d = Math.sqrt((n.x - a.x)**2 + (n.y - a.y)**2);
            if (d < record) {
                record = d;
                closestNode = n;
            }
        });

        if (closestNode) {
            const dx = a.x - closestNode.x;
            const dy = a.y - closestNode.y;
            // Normalize
            const len = Math.sqrt(dx*dx + dy*dy);
            closestNode.dir.x += dx / len;
            closestNode.dir.y += dy / len;
            closestNode.count++;
        }
    });

    // 2. Spawn new nodes
    for (let i = tree.length - 1; i >= 0; i--) {
        const n = tree[i];
        if (n.count > 0) {
            n.dir.x /= n.count; // Average direction
            n.dir.y /= n.count;
            
            // Normalize again
            const len = Math.sqrt(n.dir.x**2 + n.dir.y**2);
            if (len > 0) {
                n.dir.x /= len;
                n.dir.y /= len;
                
                const nextNode = new Node(n.x + n.dir.x * 5, n.y + n.dir.y * 5, n);
                tree.push(nextNode);
            }
        }
    }

    // 3. Remove reached attractors
    for (let i = attractors.length - 1; i >= 0; i--) {
        const a = attractors[i];
        let reached = false;
        tree.forEach(n => {
            const d = Math.sqrt((n.x - a.x)**2 + (n.y - a.y)**2);
            if (d < MIN_DIST) {
                reached = true;
            }
        });
        if (reached) attractors.splice(i, 1);
    }
    
    draw();
    if (attractors.length > 0) requestAnimationFrame(grow);
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Attractors
    ctx.fillStyle = '#ff4081';
    attractors.forEach(a => {
        ctx.beginPath();
        ctx.arc(a.x, a.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Tree
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    tree.forEach(n => {
        if (n.parent) {
            ctx.beginPath();
            ctx.moveTo(n.parent.x, n.parent.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
        }
    });
}

resetBtn.addEventListener('click', init);
growBtn.addEventListener('click', grow);

init();
