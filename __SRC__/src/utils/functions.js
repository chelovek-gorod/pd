const russianFormatter = new Intl.NumberFormat('ru-RU')
export function formatNumber(number) {
    return russianFormatter.format(number);
}

/**
 * @template {string} T
 * @param {T[]} keys
 * @returns {{[K in T]: K}}
 */
export function createEnum(keys) {
    return /** @type {any} */ (Object.fromEntries(
        keys.map(key => [key, key])
    ));
}

export function getRandom(min, max) {
    return min + Math.random() * (max - min);
}

export function shuffleArray( array ) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
    return array
}

export function setCursorPointer(target) {
    target.eventMode = 'static'
    target.on('pointerover', () => document.body.style.cursor = 'pointer')
    target.on('pointerout', () => document.body.style.cursor = 'auto')
}
export function removeCursorPointer(target) {
    target.eventMode = 'none'
    target.off('pointerover', () => document.body.style.cursor = 'pointer')
    target.off('pointerout', () => document.body.style.cursor = 'auto')
}

export function getLinesIntersectionPoint(x1, y1, x2, y2, x3, y3, x4, y4) {
    const dx1 = x2 - x1, dy1 = y2 - y1
    const dx2 = x4 - x3, dy2 = y4 - y3
    
    const denom = dy2 * dx1 - dx2 * dy1
    if (denom === 0) return null
    
    const denomRate = 1 / denom
    const dx3 = x1 - x3, dy3 = y1 - y3
    
    const ua = (dx2 * dy3 - dy2 * dx3) * denomRate
    if (ua < 0 || ua > 1) return null;
    
    const ub = (dx1 * dy3 - dy1 * dx3) * denomRate
    if (ub < 0 || ub > 1) return null
    
    return { 
        x: x1 + ua * dx1, 
        y: y1 + ua * dy1 
    }
}

export function getDistance(sprite, target) {
    let dx = target.x - sprite.x
    let dy = target.y - sprite.y
    return Math.sqrt(dx * dx + dy * dy)
}

export function moveSprite(sprite, pathSize) {
    sprite.x += Math.cos(sprite.rotation) * pathSize
    sprite.y += Math.sin(sprite.rotation) * pathSize
}

export function moveSpriteByDirection(sprite, pathSize) {
    sprite.x += Math.cos(sprite.direction) * pathSize
    sprite.y += Math.sin(sprite.direction) * pathSize
}

const _2PI = Math.PI * 2
export function turnSpriteToTarget(sprite, target, turnAngle) {
    let pointDirection = Math.atan2(target.y - sprite.y, target.x - sprite.x)
    let deflection = (pointDirection - sprite.rotation) % _2PI
    if (!deflection) return true

    if (deflection < -Math.PI) deflection += _2PI
    if (deflection >  Math.PI) deflection -= _2PI

    if (Math.abs(deflection) <= turnAngle) sprite.rotation = pointDirection
    else sprite.rotation += (deflection <  0) ? -turnAngle : turnAngle
    return false
}
export function turnSpriteDirectionToTarget(sprite, target, turnAngle) {
    let pointDirection = Math.atan2(target.y - sprite.y, target.x - sprite.x)
    let deflection = (pointDirection - sprite.direction) % _2PI
    if (!deflection) return true

    if (deflection < -Math.PI) deflection += _2PI
    if (deflection >  Math.PI) deflection -= _2PI

    if (Math.abs(deflection) <= turnAngle) sprite.direction = pointDirection
    else sprite.direction += (deflection <  0) ? -turnAngle : turnAngle
    return false
}

export function moveToTarget( sprite, target, pathSize ) {
    const distance = getDistance(sprite, target)
    
    if (distance <= pathSize) {
        sprite.x = target.x
        sprite.y = target.y

        return true
    }

    const moveRate = pathSize / distance
    sprite.x += moveRate * (target.x - sprite.x)
    sprite.y += moveRate * (target.y - sprite.y)

    return false
}