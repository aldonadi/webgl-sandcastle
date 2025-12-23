import { Joystick } from './Joystick.js';

export class InputManager {
    constructor() {
        this.leftStick = new Joystick('joystick-left');
        this.rightStick = new Joystick('joystick-right');
    }

    getMoveVector() {
        return this.leftStick.getVector();
    }

    getLookVector() {
        return this.rightStick.getVector();
    }
}
