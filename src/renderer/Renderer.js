export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl');

        if (!this.gl) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }

        this.onResize();
        window.addEventListener('resize', () => this.onResize());

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        // Culling
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);

        this.scene = null;
        this.camera = null;
    }

    setClearColor(r, g, b, a = 1.0) {
        this.gl.clearColor(r, g, b, a);
    }

    onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        if (this.camera) {
            this.camera.aspect = this.canvas.width / this.canvas.height;
            this.camera.updateProjectionMatrix();
        }
    }

    setScene(scene) {
        this.scene = scene;
    }

    setCamera(camera) {
        this.camera = camera;
        this.onResize(); // Ensure aspect ratio is correct
    }

    render(light) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        if (this.scene && this.camera) {
            this.scene.draw(this.gl, this.camera, light);
        }
    }
}
