const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const addLockBtn = document.getElementById('addLockBtn');
const addMonsterBtn = document.getElementById('addMonsterBtn');
const addTreasureBtn = document.getElementById('addTreasureBtn');

const WIDTH = 600;
const HEIGHT = 400;

// Graph Node Types
const TYPE_COLORS = {
    'Start': '#4CAF50',
    'Goal': '#F44336',
    'Room': '#9E9E9E',
    'Key': '#FFD54F',
    'Lock': '#FF9800',
    'Monster': '#9C27B0',
    'Treasure': '#E91E63'
};

let nodes = [];
let edges = [];

class Node {
    constructor(type) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type;
        this.x = WIDTH / 2 + (Math.random() - 0.5) * 50;
        this.y = HEIGHT / 2 + (Math.random() - 0.5) * 50;
        this.vx = 0;
        this.vy = 0;
        
        // Initial separation based on type (roughly)
        if (type === 'Start') this.x = 50;
        if (type === 'Goal') this.x = WIDTH - 50;
    }
}

function init() {
    nodes = [];
    edges = [];
    const start = new Node('Start');
    const goal = new Node('Goal');
    nodes.push(start, goal);
    edges.push({ source: start, target: goal });
    draw();
}

function physics() {
    // Force Directed Graph simplified
    const k = 100; // Ideal length
    const repulsion = 2000;
    
    // Repulsion
    nodes.forEach(n1 => {
        nodes.forEach(n2 => {
            if (n1 === n2) return;
            let dx = n1.x - n2.x;
            let dy = n1.y - n2.y;
            let dist = Math.sqrt(dx*dx + dy*dy) || 0.1;
            let force = repulsion / (dist * dist);
            n1.vx += (dx / dist) * force;
            n1.vy += (dy / dist) * force;
        });
    });

    // Spring attraction
    edges.forEach(edge => {
        let dx = edge.target.x - edge.source.x;
        let dy = edge.target.y - edge.source.y;
        let dist = Math.sqrt(dx*dx + dy*dy) || 0.1;
        let force = (dist - k) * 0.05;
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        
        edge.source.vx += fx;
        edge.source.vy += fy;
        edge.target.vx -= fx;
        edge.target.vy -= fy;
    });

    // Center gravity
    nodes.forEach(n => {
        let dx = (WIDTH/2) - n.x;
        let dy = (HEIGHT/2) - n.y;
        n.vx += dx * 0.01;
        n.vy += dy * 0.01;

        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.8; // Friction
        n.vy *= 0.8;
    });
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    physics();

    // Edges
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    edges.forEach(e => {
        ctx.beginPath();
        ctx.moveTo(e.source.x, e.source.y);
        ctx.lineTo(e.target.x, e.target.y);
        ctx.stroke();
    });

    // Nodes
    nodes.forEach(n => {
        ctx.fillStyle = TYPE_COLORS[n.type] || '#fff';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(n.type, n.x, n.y + 25);
    });

    requestAnimationFrame(draw);
}

// === Grammar Rules ===

function splitEdge(type) {
    if (edges.length === 0) return;
    // Pick a random edge
    const edgeIndex = Math.floor(Math.random() * edges.length);
    const edge = edges[edgeIndex];
    
    // Create new node
    const newNode = new Node(type);
    newNode.x = (edge.source.x + edge.target.x) / 2;
    newNode.y = (edge.source.y + edge.target.y) / 2;
    
    nodes.push(newNode);
    
    // Replace old edge with two new edges
    edges.splice(edgeIndex, 1);
    edges.push({ source: edge.source, target: newNode });
    edges.push({ source: newNode, target: edge.target });
}

function addLockKey() {
    if (edges.length === 0) return;
    const edgeIndex = Math.floor(Math.random() * edges.length);
    const edge = edges[edgeIndex];
    
    const key = new Node('Key');
    const lock = new Node('Lock');
    
    // Position roughly
    key.x = edge.source.x; 
    lock.x = edge.target.x;
    
    nodes.push(key, lock);
    
    edges.splice(edgeIndex, 1);
    edges.push({ source: edge.source, target: key });
    edges.push({ source: key, target: lock });
    edges.push({ source: lock, target: edge.target });
}

function addTreasureBranch() {
    if (nodes.length === 0) return;
    // Pick a random node that isn't goal
    const validNodes = nodes.filter(n => n.type !== 'Goal');
    const parent = validNodes[Math.floor(Math.random() * validNodes.length)];
    
    const treasure = new Node('Treasure');
    treasure.x = parent.x + (Math.random()-0.5)*50;
    treasure.y = parent.y + (Math.random()-0.5)*50;
    
    nodes.push(treasure);
    edges.push({ source: parent, target: treasure });
}

resetBtn.addEventListener('click', init);
addMonsterBtn.addEventListener('click', () => splitEdge('Monster'));
addLockBtn.addEventListener('click', addLockKey);
addTreasureBtn.addEventListener('click', addTreasureBranch);

init();
