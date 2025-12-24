# Implementation Plan - Epic Sandcastle Expansion

## Goal Description
Refactor the castle construction to use the dedicated `CastleBuilder` class and expand the castle to be much larger, multilevel, with long walls, parapets, and at least 6 turrets.

## User Review Required
> [!NOTE]
> I will be removing the old inline castle construction code from `main.js`. If there were any specific tweaks in there you liked, they might be lost, but `CastleBuilder` seems superior.

## Proposed Changes

### Scene Construction
#### [MODIFY] [main.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/main.js)
- Import `CastleBuilder`.
- Remove inline castle generation (Keep, Towers, Walls, Bridge).
- Instantiate `CastleBuilder` and call `build()`.
- Adjust player spawn position to be further back to accommodate the larger castle.

### Castle Generation
#### [MODIFY] [CastleBuilder.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/scene/CastleBuilder.js)
- Update `config` defaults to scale up dimensions (40x40 -> 60x60 or larger).
- Add `createParapets` method to add crenellations on top of walls.
- Ensure at least 6 turrets are created (currently 4 corner + 2 gatehouse = 6, will add intermediate towers on long walls).
- Refine `buildKeep` to be more massive and multilevel.

## Verification Plan

### Automated Tests
- None available for visual output.

### Manual Verification
- Run the app in the browser.
- Visual inspection:
    - Check for a much larger castle structure.
    - Count turrets (should be >= 6).
    - Verify parapets on walls.
    - inner Keep should be multilevel.
    - Frame rate should remain acceptable.
