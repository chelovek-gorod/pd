export const MOVE_DIRECTION = {
    NONE: { x: 0, y: 0 },
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    UP_LEFT: { x: -1, y: -1 },
    UP_RIGHT: { x: 1, y: -1 },
    DOWN_LEFT: { x: -1, y: 1 },
    DOWN_RIGHT: { x: 1, y: 1 }
}

export const ZOOM_DIRECTION = {
    IN: 1,
    OUT: -1,
    NONE: 0
}

export const ROTATE_DIRECTION = {
    LEFT: -1,
    RIGHT: 1,
    NONE: 0
}

export const MOVE_SPEED = 0.1
export const ZOOM_SPEED = 0.001
export const ROTATE_SPEED = 0.001
export const RETURN_SPEED = 0.1

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 10

// Тряска камеры
export const SHAKE_DEFAULT_DURATION = 1500
export const SHAKE_DEFAULT_AMPLITUDE = 5
export const SHAKE_DEFAULT_COUNT = 15