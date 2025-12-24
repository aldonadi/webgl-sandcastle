export class Scene {
    constructor() {
        this.children = [];
    }

    add(object) {
        this.children.push(object);
    }

    draw(gl, camera, light) {
        for (const child of this.children) {
            child.draw(gl, camera, light);
        }
    }
}
