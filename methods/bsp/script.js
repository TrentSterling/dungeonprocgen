const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const generateBtn = document.getElementById('generateBtn');

const CANVAS_SIZE = 400;
const MIN_ROOM_SIZE = 40;
const SPLIT_THRESHOLD = 100;

class Rect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.left = null;
        this.right = null;
        this.room = null;
    }

    split() {
        if (this.left || this.right) return false;

        let splitHorizontal = Math.random() > 0.5;
        if (this.w > this.h && this.w / this.h >= 1.25) splitHorizontal = false;
        else if (this.h > this.w && this.h / this.w >= 1.25) splitHorizontal = true;

        const max = (splitHorizontal ? this.h : this.w) - MIN_ROOM_SIZE;
        if (max <= MIN_ROOM_SIZE) return false;

        const splitAt = Math.floor(Math.random() * (max - MIN_ROOM_SIZE) + MIN_ROOM_SIZE);

        if (splitHorizontal) {
            this.left = new Rect(this.x, this.y, this.w, splitAt);
            this.right = new Rect(this.x, this.y + splitAt, this.w, this.h - splitAt);
        } else {
            this.left = new Rect(this.x, this.y, splitAt, this.h);
            this.right = new Rect(this.x + splitAt, this.y, this.w - splitAt, this.h);
        }
        return true;
    }

    createRoom() {
        if (this.left || this.right) {
            if (this.left) this.left.createRoom();
            if (this.right) this.right.createRoom();
        } else {
            const w = Math.floor(Math.random() * (this.w - 10) + 10);
            const h = Math.floor(Math.random() * (this.h - 10) + 10);
            const x = Math.floor(Math.random() * (this.w - w));
            const y = Math.floor(Math.random() * (this.h - h));
            this.room = { x: this.x + x, y: this.y + y, w, h };
        }
    }
}

function drawRects(rect) {
    ctx.strokeStyle = '#555';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    if (rect.room) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(rect.room.x, rect.room.y, rect.room.w, rect.room.h);
    }

    if (rect.left) drawRects(rect.left);
    if (rect.right) drawRects(rect.right);
}

function generate() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const root = new Rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const rects = [root];
    
    let didSplit = true;
    while (didSplit) {
        didSplit = false;
        rects.forEach(r => {
            if (!r.left && !r.right) {
                if (r.w > SPLIT_THRESHOLD || r.h > SPLIT_THRESHOLD || Math.random() > 0.2) {
                    if (r.split()) {
                        rects.push(r.left, r.right);
                        didSplit = true;
                    }
                }
            }
        });
    }

    root.createRoom();
    drawRects(root);
}

generateBtn.addEventListener('click', generate);
generate();
