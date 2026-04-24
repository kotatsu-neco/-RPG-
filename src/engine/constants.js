export const ENGINE_VERSION = "2.0";

export const TILE_SIZE = 16;
export const CANVAS_COLS = 20;
export const CANVAS_ROWS = 30;

export const DIRECTIONS = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
};

export function directionDelta(direction) {
  return {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  }[direction] || [0, 0];
}
