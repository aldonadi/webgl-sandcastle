# Verification Walkthrough

## 1. Verify Player Appearance
- [ ] Check that a sphere object appears in the scene (reddish marble texture).
- [ ] Ensure it receives lighting and has a visible texture.

## 2. Verify Movement (Tank Controls)
- [ ] Use the Left Joystick (Movement).
- [ ] **Forward (Up)**: Player moves forward (away from camera). Camera follows.
- [ ] **Backward (Down)**: Player moves backward (towards camera). **Crucially**: The player sphere should rotate 180 degrees to face the camera while moving backward. 
- [ ] **Turn Left/Right**: Pushing Left/Right should rotate the character. The Camera should rotate with the character (staying behind the shoulder).
- [ ] **Look Override**: Right Joystick should still allow orbiting, but if you move the character, the camera should snap back to following? (Check logic: Strict Follow only engages if Look Input is 0). 

## 3. Verify Orbit (Case 2)
- [ ] Stop moving the player.
- [ ] Use the Right Joystick to orbit around the player.
- [ ] You should be able to see the face of the sphere (front/side) by rotating the camera.
- [ ] Ensure the camera orbits a point slightly above the player (over-the-shoulder center).

## 4. Verify Collision
- [ ] Walk into the **Central Keep**. The player should stop and slide along the wall, not pass through.
- [ ] Walk into the **Towers**.
- [ ] Walk into the **Walls**.
- [ ] Note: The bridge is not collidable in this version (can walk through the railings/base if they are just visual vs logical).

## 5. Aesthetics
- [ ] Confirm "Attractively-textured" sphere (Marble pattern).
- [ ] Confirm Camera "Over the shoulder" feel.
- [ ] **Breathing**: Confirm the sphere gently squishes/pulses (breathes) while idle.
