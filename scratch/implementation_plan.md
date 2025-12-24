# Implementation Plan - Jump Mechanics

## Goal Description
Implement player jumping by tapping the look joystick. The jump should be physics-based, allowing for directional control and landing on surfaces.

## User Review Required
None.

## Proposed Changes

### Input Handling
#### [MODIFY] [Joystick.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/input/Joystick.js)
- Add tap detection logic:
    - Record `startTime` and `startPos` on input start.
    - Check for short duration (< 200ms) and minimal movement (< 10px) on input end.
    - Flag `wasTapped` as true if conditions are met.
    - Add `hasTapped()` method that consumes the flag (returns true once then resets).

#### [MODIFY] [InputManager.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/input/InputManager.js)
- Add `getActions()` method:
    - Returns `{ jump: boolean }`.
    - Checks `this.rightStick.hasTapped()`.

### Player Physics
#### [MODIFY] [Player.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/scene/Player.js)
- Update `update()` to accept `actions` object.
- Implement Jump Logic:
    - Determine `isGrounded` status (touching floor `y <= radius` OR standing on object with `ny > 0.7`).
    - If `actions.jump` is true AND `isGrounded`:
        - Set `velocity.y` to calculated jump speed (`sqrt(2 * g * h)`).
    - Target Height: `3 * diameter` = `3.0` units (since r=0.5, d=1.0).
- Refine Collision Logic:
    - Ensure `velocity.y` is reset when hitting ceiling or landing.
    - Allow jumping whilst moving (velocity inheritance is implicit in position update).

### Main Loop
#### [MODIFY] [main.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/main.js)
- Pass `actions` from `InputManager` to `Player.update`.

## Verification Plan

### Manual Verification
- **Tap to Jump**: Tap right joystick/right side of screen. Player should launch up.
- **Height**: Visually compare jump height to player size (should be roughly 3x height).
- **Landing**: Jump onto castle wall or blocks. Player should land and stay.
- **Direction**: Run and jump. Player should arc through air.
