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
}
