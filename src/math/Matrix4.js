import { Vector3 } from './Vector3.js';

export class Matrix4 {
    constructor() {
        this.elements = new Float32Array(16);
        this.identity();
    }

    identity() {
        const e = this.elements;
        e[0] = 1; e[4] = 0; e[8] = 0; e[12] = 0;
        e[1] = 0; e[5] = 1; e[9] = 0; e[13] = 0;
        e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        return this;
    }

    setTranslate(x, y, z) {
        const e = this.elements;
        e[0] = 1; e[4] = 0; e[8] = 0; e[12] = x;
        e[1] = 0; e[5] = 1; e[9] = 0; e[13] = y;
        e[2] = 0; e[6] = 0; e[10] = 1; e[14] = z;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        return this;
    }

    translate(x, y, z) {
        const e = this.elements;
        e[12] += e[0] * x + e[4] * y + e[8] * z;
        e[13] += e[1] * x + e[5] * y + e[9] * z;
        e[14] += e[2] * x + e[6] * y + e[10] * z;
        e[15] += e[3] * x + e[7] * y + e[11] * z;
        return this;
    }

    multiply(m) {
        return this.multiplyMatrices(this, m);
    }

    multiplyMatrices(a, b) {
        const ae = a.elements;
        const be = b.elements;
        const te = this.elements;

        const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
        const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
        const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
        const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

        const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
        const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
        const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
        const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

        te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

        te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

        te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

        te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

        return this;
    }

    setRotate(angle, x, y, z) {
        const e = this.elements;
        let s = Math.sin(angle);
        let c = Math.cos(angle);
        let len = Math.sqrt(x * x + y * y + z * z);

        if (len < 0.0001) { return null; }

        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;

        let nc = 1 - c;
        let xy = x * y;
        let yz = y * z;
        let zx = z * x;
        let xs = x * s;
        let ys = y * s;
        let zs = z * s;

        e[0] = x * x * nc + c;
        e[1] = xy * nc + zs;
        e[2] = zx * nc - ys;
        e[3] = 0;

        e[4] = xy * nc - zs;
        e[5] = y * y * nc + c;
        e[6] = yz * nc + xs;
        e[7] = 0;

        e[8] = zx * nc + ys;
        e[9] = yz * nc - xs;
        e[10] = z * z * nc + c;
        e[11] = 0;

        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;

        return this;
    }

    rotate(angle, x, y, z) {
        const m = new Matrix4();
        m.setRotate(angle, x, y, z);
        return this.multiply(m);
    }

    setScale(x, y, z) {
        const e = this.elements;
        e[0] = x; e[4] = 0; e[8] = 0; e[12] = 0;
        e[1] = 0; e[5] = y; e[9] = 0; e[13] = 0;
        e[2] = 0; e[6] = 0; e[10] = z; e[14] = 0;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        return this;
    }

    scale(x, y, z) {
        const m = new Matrix4();
        m.setScale(x, y, z);
        return this.multiply(m);
    }

    setPerspective(fovy, aspect, near, far) {
        const e = this.elements;
        const f = 1.0 / Math.tan(fovy * Math.PI / 360);
        const nf = 1 / (near - far);

        e[0] = f / aspect;
        e[1] = 0;
        e[2] = 0;
        e[3] = 0;

        e[4] = 0;
        e[5] = f;
        e[6] = 0;
        e[7] = 0;

        e[8] = 0;
        e[9] = 0;
        e[10] = (far + near) * nf;
        e[11] = -1;

        e[12] = 0;
        e[13] = 0;
        e[14] = (2 * far * near) * nf;
        e[15] = 0;

        return this;
    }

    setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
        const e = this.elements;

        const fx = centerX - eyeX;
        const fy = centerY - eyeY;
        const fz = centerZ - eyeZ;

        const rlf = 1 / Math.sqrt(fx * fx + fy * fy + fz * fz);
        const fx_n = fx * rlf;
        const fy_n = fy * rlf;
        const fz_n = fz * rlf;

        const rls = 1 / Math.sqrt(upX * upX + upY * upY + upZ * upZ); // normalize up mainly for cross product stability
        // Actually standard lookAt uses up as-is and recomputes true up, but usually we just cross f and up

        // Side = f x up
        const sx = fy_n * upZ - fz_n * upY;
        const sy = fz_n * upX - fx_n * upZ;
        const sz = fx_n * upY - fy_n * upX;

        // Re-normalize side
        const rlside = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
        const sx_n = sx * rlside;
        const sy_n = sy * rlside;
        const sz_n = sz * rlside;

        // Up = s x f
        const ux = sy_n * fz_n - sz_n * fy_n;
        const uy = sz_n * fx_n - sx_n * fz_n;
        const uz = sx_n * fy_n - sy_n * fx_n;

        e[0] = sx_n;
        e[1] = ux;
        e[2] = -fx_n;
        e[3] = 0;

        e[4] = sy_n;
        e[5] = uy;
        e[6] = -fy_n;
        e[7] = 0;

        e[8] = sz_n;
        e[9] = uz;
        e[10] = -fz_n;
        e[11] = 0;

        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;

        // Translation part
        // The previous part creates a rotation matrix.
        // We need to apply translation (-eye) * rotation
        // M = R * T

        // Or just do dot products
        const tx = -eyeX;
        const ty = -eyeY;
        const tz = -eyeZ;

        e[12] = sx_n * tx + sy_n * ty + sz_n * tz;
        e[13] = ux * tx + uy * ty + uz * tz;
        e[14] = -fx_n * tx - fy_n * ty - fz_n * tz;

        return this;
    }
}
