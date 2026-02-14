// Easing functions
const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOutElastic: x => {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    },
    easeOutBounce: x => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (x < 1 / d1) {
            return n1 * x * x;
        } else if (x < 2 / d1) {
            return n1 * (x -= 1.5 / d1) * x + 0.75;
        } else if (x < 2.5 / d1) {
            return n1 * (x -= 2.25 / d1) * x + 0.9375;
        } else {
            return n1 * (x -= 2.625 / d1) * x + 0.984375;
        }
    }
};

class Animator {
    constructor() {
        this.animations = [];
        this.lastTime = 0;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    add(duration, updateFn, easeFn = Easing.easeOutQuad, onComplete = null) {
        this.animations.push({
            startTime: performance.now(),
            duration: duration,
            update: updateFn,
            ease: easeFn,
            onComplete: onComplete
        });
    }

    animate(currentTime) {
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            const elapsed = currentTime - anim.startTime;
            let progress = Math.min(elapsed / anim.duration, 1);
            
            const value = anim.ease(progress);
            anim.update(value);

            if (progress >= 1) {
                if (anim.onComplete) anim.onComplete();
                this.animations.splice(i, 1);
            }
        }
        requestAnimationFrame(this.animate);
    }
}

const animator = new Animator();
