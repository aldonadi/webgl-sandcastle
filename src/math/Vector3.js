export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.elements = [x, y, z];
    }

    get x() { return this.elements[0]; }
    get y() { return this.elements[1]; }
    get z() { return this.elements[2]; }

    set x(v) { this.elements[0] = v; }
    set y(v) { this.elements[1] = v; }
    set z(v) { this.elements[2] = v; }

    set(x, y, z) {
        this.elements[0] = x;
        this.elements[1] = y;
        this.elements[2] = z;
        return this;
    }

    normalize() {
        const x = this.elements[0];
        const y = this.elements[1];
        const z = this.elements[2];
        let len = x * x + y * y + z * z;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            this.elements[0] *= len;
            this.elements[1] *= len;
            this.elements[2] *= len;
        }
        return this;
    }

    subVectors(a, b) {
        this.elements[0] = a.elements[0] - b.elements[0];
        this.elements[1] = a.elements[1] - b.elements[1];
        this.elements[2] = a.elements[2] - b.elements[2];
        return this;
    }

    crossVectors(a, b) {
        const ax = a.elements[0], ay = a.elements[1], az = a.elements[2];
        const bx = b.elements[0], by = b.elements[1], bz = b.elements[2];
        this.elements[0] = ay * bz - az * by;
        this.elements[1] = az * bx - ax * bz;
        this.elements[2] = ax * by - ay * bx;
        return this;
    }

    add(v) {
        this.elements[0] += v.elements[0];
        this.elements[1] += v.elements[1];
        this.elements[2] += v.elements[2];
        return this;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    applyMatrix4(m) {
        const x = this.x, y = this.y, z = this.z;
        const e = m.elements;

        const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

        this.elements[0] = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        this.elements[1] = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        this.elements[2] = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

        return this;
    }

    min(v) {
        this.elements[0] = Math.min(this.elements[0], v.elements[0]);
        this.elements[1] = Math.min(this.elements[1], v.elements[1]);
        this.elements[2] = Math.min(this.elements[2], v.elements[2]);
        return this;
    }

    max(v) {
        this.elements[0] = Math.max(this.elements[0], v.elements[0]);
        this.elements[1] = Math.max(this.elements[1], v.elements[1]);
        this.elements[2] = Math.max(this.elements[2], v.elements[2]);
        return this;
    }

    clamp(minVal, maxVal) {
        this.elements[0] = Math.max(minVal.elements[0], Math.min(maxVal.elements[0], this.elements[0]));
        this.elements[1] = Math.max(minVal.elements[1], Math.min(maxVal.elements[1], this.elements[1]));
        this.elements[2] = Math.max(minVal.elements[2], Math.min(maxVal.elements[2], this.elements[2]));
        return this;
    }

    distanceTo(v) {
        return Math.sqrt(this.distanceToSquared(v));
    }

    distanceToSquared(v) {
        const dx = this.elements[0] - v.elements[0];
        const dy = this.elements[1] - v.elements[1];
        const dz = this.elements[2] - v.elements[2];
        return dx * dx + dy * dy + dz * dz;
    }

    length() {
        return Math.sqrt(this.elements[0] * this.elements[0] + this.elements[1] * this.elements[1] + this.elements[2] * this.elements[2]);
    }

    multiplyScalar(s) {
        this.elements[0] *= s;
        this.elements[1] *= s;
        this.elements[2] *= s;
        return this;
    }
}
