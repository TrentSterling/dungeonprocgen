const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const xMirrorCheck = document.getElementById('xMirror');
const yMirrorCheck = document.getElementById('yMirror');

const WIDTH = 400;
const HEIGHT = 400;

let drawing = false;

function init() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawGrid();
}

function drawGrid() {
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(WIDTH/2, 0); ctx.lineTo(WIDTH/2, HEIGHT);
    ctx.moveTo(0, HEIGHT/2); ctx.lineTo(WIDTH, HEIGHT/2);
    ctx.stroke();
}

function paint(x, y) {
    ctx.fillStyle = '#fff';
    const size = 10;
    
    // Draw original
    ctx.fillRect(x - size/2, y - size/2, size, size);

    // Mirror X
    if (xMirrorCheck.checked) {
        ctx.fillRect((WIDTH - x) - size/2, y - size/2, size, size);
    }
    
    // Mirror Y
    if (yMirrorCheck.checked) {
        ctx.fillRect(x - size/2, (HEIGHT - y) - size/2, size, size);
    }

    // Mirror Both
    if (xMirrorCheck.checked && yMirrorCheck.checked) {
        ctx.fillRect((WIDTH - x) - size/2, (HEIGHT - y) - size/2, size, size);
    }
}

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    paint(x, y);
});

resetBtn.addEventListener('click', init);

init();
