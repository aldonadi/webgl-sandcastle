export class Joystick {
    constructor(zoneId, knobInfo) { // knobInfo or just assume class inside
        this.zone = document.getElementById(zoneId);
        this.knob = this.zone.querySelector('.joystick-knob');

        this.rect = null;
        this.active = false;
        this.touchId = null;

        this.input = { x: 0, y: 0 };

        this.origin = { x: 0, y: 0 };
        this.position = { x: 0, y: 0 };

        // Config
        this.radius = 60; // Half of zone width

        this.bindEvents();
    }

    bindEvents() {
        this.zone.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.onTouchEnd(e));
        document.addEventListener('touchcancel', (e) => this.onTouchEnd(e));

        // Mouse fallback for testing
        this.zone.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    updateRect() {
        const rect = this.zone.getBoundingClientRect();
        this.origin.x = rect.left + rect.width / 2;
        this.origin.y = rect.top + rect.height / 2;
    }

    // --- Touch ---

    onTouchStart(e) {
        e.preventDefault();
        if (this.active) return;

        const touch = e.changedTouches[0];
        this.touchId = touch.identifier;
        this.active = true;
        this.updateRect();
        this.handleInput(touch.clientX, touch.clientY);
    }

    onTouchMove(e) {
        if (!this.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchId) {
                e.preventDefault();
                this.handleInput(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                break;
            }
        }
    }

    onTouchEnd(e) {
        if (!this.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchId) {
                this.reset();
                break;
            }
        }
    }

    // --- Mouse ---

    onMouseDown(e) {
        e.preventDefault();
        this.active = true;
        this.updateRect();
        this.handleInput(e.clientX, e.clientY);
    }

    onMouseMove(e) {
        if (this.active) {
            e.preventDefault();
            this.handleInput(e.clientX, e.clientY);
        }
    }

    onMouseUp(e) {
        if (this.active) {
            this.reset();
        }
    }

    // --- Logic ---

    handleInput(clientX, clientY) {
        let dx = clientX - this.origin.x;
        let dy = clientY - this.origin.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.radius) {
            const ratio = this.radius / distance;
            dx *= ratio;
            dy *= ratio;
        }

        this.input.x = dx / this.radius;
        this.input.y = dy / this.radius; // y down is positive in screen, so usually forward needs inversion

        this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    reset() {
        this.active = false;
        this.touchId = null;
        this.input.x = 0;
        this.input.y = 0;
        this.knob.style.transform = `translate(-50%, -50%)`;
    }

    getVector() {
        return this.input;
    }
}
