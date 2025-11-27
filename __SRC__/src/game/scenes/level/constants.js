import { createEnum } from "../../../utils/functions"

export const GUN_TYPE = {
    'NONE': 'NONE',
    'ROCKETER': 'ROCKETER',
    'GATLING': 'GATLING',
    'TESLA': 'TESLA',
    'PRISMA': 'PRISMA',
    'RADAR': 'RADAR',
}

export const ENEMY_MOVEMENT_STATE = createEnum([ "IN", "MOVE", "ATTACK" ])

// orbits
const _2_PI = Math.PI * 2
const _H_PI = Math.PI * 0.5

export const ORBIT_LINE = {
    width: 2,
    color: 0x00ff00,
    alpha: 0.2,
}

const OBJECT_MIN_SCALE = 0.6
export const ORBIT_A = {
    radius: 180,
    pathSize: 0,
    path: null,
    speed: 0.06,

    launchPath: null,
}
export const ORBIT_mines = {
    radius: 270,
    pathSize: 0,
    path: null,
    speed: 0.05,

    launchPath: null,
}
export const ORBIT_B = {
    radius: 390,
    pathSize: 0,
    path: null,
    speed: 0.04,
    
    launchPath: null,
}

const maxRadius = Math.max(ORBIT_A.radius, ORBIT_B.radius)
const scaleRate = (1 - OBJECT_MIN_SCALE) / (2 * maxRadius)

ORBIT_A.pathSize = Math.ceil(_2_PI * ORBIT_A.radius)
ORBIT_mines.pathSize = Math.ceil(_2_PI * ORBIT_mines.radius)
ORBIT_B.pathSize = Math.ceil(_2_PI * ORBIT_B.radius)

generateOrbitPath(ORBIT_A)
generateOrbitPath(ORBIT_mines)
generateOrbitPath(ORBIT_B)

function generateOrbitPath(orbit) {
    orbit.path = new Float32Array(orbit.pathSize * 4)
    
    for (let i = 0; i < orbit.pathSize; i++) {
        const angle = (i / orbit.pathSize) * _2_PI
        const y = Math.sin(angle) * orbit.radius
        const x = Math.cos(angle) * orbit.radius
        const scale = (y + maxRadius) * scaleRate + OBJECT_MIN_SCALE
        const rotation = angle + _H_PI
        
        const index = i * 4
        orbit.path[index] = x
        orbit.path[index + 1] = y
        orbit.path[index + 2] = scale
        orbit.path[index + 3] = rotation
    }
}

// launch paths

export const LAUNCH_PATH_A = {
    radius: ORBIT_A.radius,
    turns: 1.7,
    dropEngineIndexRate: 0.4,
    dropEngineIndex: 0,
    pathSize: 0,
    path: null,
    nearestOrbitPointIndex: 0,
}

export const LAUNCH_PATH_mines = {
    radius: ORBIT_mines.radius,
    turns: 1.5,
    dropEngineIndexRate: 0.3,
    dropEngineIndex: 0,
    pathSize: 0,
    path: null,
    nearestOrbitPointIndex: 0,
}
export const LAUNCH_PATH_B = {
    radius: ORBIT_B.radius,
    turns: 1.2,
    dropEngineIndexRate: 0.2,
    dropEngineIndex: 0,
    pathSize: 0,
    path: null,
    nearestOrbitPointIndex: 0,
}

const LAUNCH_PATH_A_SIZE_RATE = 0.7
const LAUNCH_PATH_mines_SIZE_RATE = 0.8
const LAUNCH_PATH_B_SIZE_RATE = 0.9

generateLaunchPath(LAUNCH_PATH_A)
generateLaunchPath(LAUNCH_PATH_mines)
generateLaunchPath(LAUNCH_PATH_B)

function generateLaunchPath(launchPath) {
    const spiralLength = _2_PI * launchPath.radius * launchPath.turns
    const fullPathSize = Math.ceil(spiralLength)
    let targetOrbit = null

    switch(launchPath) {
        case LAUNCH_PATH_A :
            launchPath.pathSize = Math.ceil(fullPathSize * LAUNCH_PATH_A_SIZE_RATE)
            targetOrbit = ORBIT_A
        break
        case LAUNCH_PATH_mines :
            launchPath.pathSize = Math.ceil(fullPathSize * LAUNCH_PATH_mines_SIZE_RATE)
            targetOrbit = ORBIT_mines
        break
        case LAUNCH_PATH_B :
            launchPath.pathSize = Math.ceil(fullPathSize * LAUNCH_PATH_B_SIZE_RATE)
            targetOrbit = ORBIT_B
        break
    }

    targetOrbit.launchPath = launchPath
    
    const startIndex = fullPathSize - launchPath.pathSize
    
    launchPath.path = new Float32Array(launchPath.pathSize * 4)
    launchPath.dropEngineIndex = Math.floor(launchPath.pathSize * launchPath.dropEngineIndexRate)

    // вычисляем координаты последней точки
    const lastOriginalProgress = (startIndex + launchPath.pathSize - 1) / fullPathSize
    const lastSpiralProgress = lastOriginalProgress * launchPath.turns * _2_PI
    const lastRadius = lastOriginalProgress * launchPath.radius
    const lastPointY = Math.sin(lastSpiralProgress) * lastRadius
    
    // Теперь вычисляем масштаб для последней точки
    const targetScale = (lastPointY + maxRadius) * scaleRate + OBJECT_MIN_SCALE
    const stepScale = targetScale / (launchPath.dropEngineIndex * 2)

    for (let i = 0; i < launchPath.pathSize; i++) {
        const originalProgress = (startIndex + i) / fullPathSize
        const spiralProgress = originalProgress * launchPath.turns * _2_PI
        const radius = originalProgress * launchPath.radius
        const y = Math.sin(spiralProgress) * radius
        const x = Math.cos(spiralProgress) * radius
        
        const index = i * 4
        launchPath.path[index] = x
        launchPath.path[index + 1] = y
        launchPath.path[index + 2] = Math.min(targetScale, i * stepScale)
        launchPath.path[index + 3] = spiralProgress + _H_PI
    }

    // Находим ближайшую точку орбиты к последней точке пути
    const lastIndex = (launchPath.pathSize - 1) * 4
    const lastX = launchPath.path[lastIndex]
    const lastY = launchPath.path[lastIndex + 1]
    launchPath.nearestOrbitPointIndex = findNearestOrbitPointIndex(targetOrbit, lastX, lastY)
}


function findNearestOrbitPointIndex(orbit, targetX, targetY) {
    let closestIndex = 0
    let minDistance = Infinity
    
    for (let i = 0; i < orbit.pathSize; i++) {
        const baseIndex = i * 4
        const orbitX = orbit.path[baseIndex]
        const orbitY = orbit.path[baseIndex + 1]
        
        const dx = orbitX - targetX
        const dy = orbitY - targetY
        const distance = dx * dx + dy * dy
        
        if (distance < minDistance) {
            minDistance = distance
            closestIndex = i
        }
    }
    
    return closestIndex
}

// view scale

const ORBIT_VIEW_OFFSET = 120
export const SCALE_SIZES = {
    min: (ORBIT_B.radius + ORBIT_VIEW_OFFSET) * 2,
    max: (ORBIT_B.radius + ORBIT_VIEW_OFFSET) * 3,
    speed: 0.0006
}

// enemies spawner

export const EARTH_RADIUS = 80
const SCALE_DOWN_RADIUS = EARTH_RADIUS + Math.floor((ORBIT_A.radius - EARTH_RADIUS) * 0.5)
const SCALE_UP_DISTANCE = ORBIT_VIEW_OFFSET * 2
const ENEMY_SPAWN_RADIUS = ORBIT_B.radius + ORBIT_VIEW_OFFSET * 2 + SCALE_UP_DISTANCE
const SCALE_UP_RADIUS = ENEMY_SPAWN_RADIUS - SCALE_UP_DISTANCE

export const ENEMY_PATHS_MIN = [] // Короткие (почти прямые)
export const ENEMY_PATHS_MID = [] // Средние (пол витка)  
export const ENEMY_PATHS_MAX = [] // Длинные (полный оборот)

// Генерируем 21 путь (7 каждого типа), чередуя типы по секторам
for (let sector = 0; sector < 21; sector++) {
    const angleOffset = (sector * 360 / 21) * (Math.PI / 180) // 17.143°
    
    // Определяем тип пути по номеру сектора (0,1,2,0,1,2...)
    const type = sector % 3
    const variant = Math.floor(sector / 3) // 0-6 для каждого типа
    
    const path = generateEnemyPath(type, variant, angleOffset)
    
    // Распределяем по соответствующим массивам
    switch(type) {
        case 0:
            ENEMY_PATHS_MIN.push(path)
            break
        case 1:
            ENEMY_PATHS_MID.push(path)
            break
        case 2:
            ENEMY_PATHS_MAX.push(path)
            break
    }
}

function generateEnemyPath(type, variant, angleOffset) {
    let turns, endRadius
    
    switch(type) {
        case 0: turns = 0.3; endRadius = EARTH_RADIUS - 50; break
        case 1: turns = 0.9; endRadius = EARTH_RADIUS - 40; break
        case 2: turns = 1.5; endRadius = EARTH_RADIUS - 30; break
    }
    
    const path = []
    const totalAngle = turns * 2 * Math.PI
    const R_start = ENEMY_SPAWN_RADIUS
    const R_end = endRadius
    
    const dr_dtheta = -(R_start - R_end) / totalAngle
    const scaleDownRange = SCALE_DOWN_RADIUS - endRadius
    
    let currentAngle = 0
    let currentRadius = R_start
    
    while (currentAngle < totalAngle) {
        const x = Math.cos(angleOffset + currentAngle) * currentRadius
        const y = Math.sin(angleOffset + currentAngle) * currentRadius
        
        let scale = 1
        if (currentRadius < SCALE_DOWN_RADIUS) {
            scale = (currentRadius - endRadius) / scaleDownRange
        } else if (currentRadius > SCALE_UP_RADIUS) {
            scale = 1 - (currentRadius - SCALE_UP_RADIUS) / SCALE_UP_DISTANCE
        }
        scale = Math.max(0, Math.min(1, scale))
        
        const tangentAngle = angleOffset + currentAngle + Math.PI/2 + (type === 0 ? 0 : Math.PI/4)
        
        path.push(x, y, scale, tangentAngle)
        
        // Плотность точек: от 1.0 до 0.5 в зависимости от scale
        const density = 0.5 + 0.5 * Math.sin(scale * Math.PI / 2)
        const baseStep = 1 / Math.sqrt(dr_dtheta * dr_dtheta + currentRadius * currentRadius)
        const adjustedStep = baseStep * density
        
        currentAngle += adjustedStep
        currentRadius = R_start - (currentAngle / totalAngle) * (R_start - R_end)
    }
    
    const floatPath = new Float32Array(path)
    
    return {
        path: floatPath,
        points: floatPath.length / 4,
        type,
        variant
    }
}