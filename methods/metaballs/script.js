const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const thresholdSlider = document.getElementById('threshold');

const WIDTH = 400;
const HEIGHT = 400;
const BALL_COUNT = 8;

let balls = [];

class Ball {
    constructor() {
        this.x = Math.random() * WIDTH;
        this.y = Math.random() * HEIGHT;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.r = Math.random() * 20 + 30; // Radius of influence
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0 || this.x > WIDTH) this.vx *= -1;
        if (this.y < 0 || this.y > HEIGHT) this.vy *= -1;
    }
}

function init() {
    balls = [];
    for (let i = 0; i < BALL_COUNT; i++) {
        balls.push(new Ball());
    }
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Pixel-by-pixel rendering (simulated low-res for performance)
    const RES = 4; // Render at 1/4 resolution
    const cols = WIDTH / RES;
    const rows = HEIGHT / RES;
    
    const thresh = parseInt(thresholdSlider.value);
    
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let sum = 0;
            const px = x * RES;
            const py = y * RES;
            
            // Calculate field value
            for (let b of balls) {
                const dx = px - b.x;
                const dy = py - b.y;
                const d = Math.sqrt(dx*dx + dy*dy);
                // Simple inverse distance falloff
                // value = radius / distance
                sum += b.r * 10 / (d || 1);
            }
            
            if (sum > thresh) {
                ctx.fillStyle = `hsl(${sum}, 70%, 50%)`;
                ctx.fillRect(px, py, RES, RES);
            }
        }
    }

    // Draw balls for reference (faint)
    /*
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    balls.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
    });
    */

    balls.forEach(b => b.update());
    requestAnimationFrame(draw);
}

resetBtn.addEventListener('click', init);

init();
draw();
