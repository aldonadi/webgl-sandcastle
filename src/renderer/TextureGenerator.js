export class TextureGenerator {
    constructor(gl) {
        this.gl = gl;
        this.defaultTexture = this.createSolidTexture(1, 1, '#ffffff');
    }

    createSolidTexture(width, height, color) {
        return this.createTexture(width, height, { color });
    }

    /**
     * Generates a procedural texture based on options.
     * @param {number} width 
     * @param {number} height 
     * @param {Object} options 
     * @param {string} options.color - Hex base color
     * @param {number} options.noise - 0.0 to 1.0 intensity
     * @param {Object} options.gradient - { start: '#color', end: '#color', dir: 'v'|'h' }
     */
    createTexture(width, height, options = {}) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 1. Base Gradient or Flat Color
        if (options.gradient) {
            let grad;
            if (options.gradient.dir === 'h') {
                grad = ctx.createLinearGradient(0, 0, width, 0);
            } else {
                grad = ctx.createLinearGradient(0, 0, 0, height);
            }
            grad.addColorStop(0, options.gradient.start || options.color || '#ffffff');
            grad.addColorStop(1, options.gradient.end || options.color || '#ffffff');
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = options.color || '#ffffff';
        }

        ctx.fillRect(0, 0, width, height);

        // 2. Noise Overlay
        if (options.noise && options.noise > 0) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            const amount = options.noise * 255;

            for (let i = 0; i < data.length; i += 4) {
                // Simple RGB noise
                const val = (Math.random() - 0.5) * amount;
                data[i] = Math.min(255, Math.max(0, data[i] + val));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + val));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + val));
                // Alpha unchanged
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // 3. Create WebGL Texture
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        // Upload the canvas to the texture
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);

        // Mipmaps and filtering for valid power-of-2 texturing or general usage
        // We'll generate mipmaps for better quality at distance
        if (this.isPowerOf2(width) && this.isPowerOf2(height)) {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        } else {
            // No mipmap for NPOT (Non-Power-Of-Two) textures in WebGL1 usually, but let's assume we can set filters.
            // Safest for WebGL1 is clamping to edge and linear filter
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        }
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        return texture;
    }

    isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }
}
