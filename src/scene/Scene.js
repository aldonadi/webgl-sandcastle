export class Scene {
    constructor() {
        this.children = [];
    }

    add(object) {
        this.children.push(object);
    }

    draw(gl, camera) {
        for (const child of this.children) {
            child.draw(gl, camera);
        }
    }
}
