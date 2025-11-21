import { createEnum } from "../../../utils/functions"

export const GUN_TYPE = {
    'NONE': 'NONE',
    'ROCKETER': 'ROCKETER',
    'SPARKS': 'SPARKS',
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
    radius: 200,
    pathSize: 0,
    path: null,
    speed: 0.06,
}

export const ORBIT_B = {
    radius: 360,
    pathSize: 0,
    path: null,
    speed: 0.04,
}

const maxRadius = Math.max(ORBIT_A.radius, ORBIT_B.radius)
const scaleRate = (1 - OBJECT_MIN_SCALE) / (2 * maxRadius)

ORBIT_A.pathSize = Math.ceil(_2_PI * ORBIT_A.radius)
ORBIT_B.pathSize = Math.ceil(_2_PI * ORBIT_B.radius)

generateOrbitPath(ORBIT_A)
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
    turns: 2,
    pathSize: 0,
    path: null
}

export const LAUNCH_PATH_B = {
    radius: ORBIT_B.radius,
    turns: 2,
    pathSize: 0,
    path: null
}

const LAUNCH_PATH_A_SIZE_RATE = 0.7
const LAUNCH_PATH_B_SIZE_RATE = 0.8

generateLaunchPath(LAUNCH_PATH_A)
generateLaunchPath(LAUNCH_PATH_B)

function generateLaunchPath(launchPath) {
    const spiralLength = _2_PI * launchPath.radius * launchPath.turns
    const fullPathSize = Math.ceil(spiralLength)
    
    launchPath.pathSize = Math.ceil(
        fullPathSize * (launchPath === LAUNCH_PATH_A ? LAUNCH_PATH_A_SIZE_RATE : LAUNCH_PATH_B_SIZE_RATE)
    )
    const startIndex = fullPathSize - launchPath.pathSize
    
    launchPath.path = new Float32Array(launchPath.pathSize * 4)

    const maxScale = OBJECT_MIN_SCALE + (1 - OBJECT_MIN_SCALE) * 0.5
    const stepScale = (maxScale / launchPath.pathSize) * (launchPath === LAUNCH_PATH_A ? 1.5 : 3)

    for (let i = 0; i < launchPath.pathSize; i++) {
        const originalProgress = (startIndex + i) / fullPathSize
        const spiralProgress = originalProgress * launchPath.turns * _2_PI
        const radius = originalProgress * launchPath.radius
        const y = Math.sin(spiralProgress) * radius
        const x = Math.cos(spiralProgress) * radius
        
        const index = i * 4
        launchPath.path[index] = x
        launchPath.path[index + 1] = y
        launchPath.path[index + 2] = Math.min(maxScale, i * stepScale)
        launchPath.path[index + 3] = spiralProgress + _H_PI
    }
}

// view scale

const ORBIT_VIEW_OFFSET = 180
export const SCALE_SIZES = {
    min: (ORBIT_A.radius + ORBIT_VIEW_OFFSET) * 2,
    max: (ORBIT_B.radius + ORBIT_VIEW_OFFSET * 2) * 2,
    speed: 0.0006
}

// enemies spawner

const ENEMY_SPAWN_RADIUS = ORBIT_B.radius * 2
export const EARTH_RADIUS = 80
const SCALE_UP_POINTS = 200
const SCALE_DOWN_POINTS = 300

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
    // ... остальной код без изменений ...
    let pathLength
    let turns, approachAngle, endRadius
    
    switch(type) {
        case 0: // ENEMY_PATHS_MIN - почти прямые
            turns = 0.1
            approachAngle = Math.PI * 0.8
            endRadius = EARTH_RADIUS - 50
            pathLength = ENEMY_SPAWN_RADIUS - endRadius
            break
        case 1: // ENEMY_PATHS_MID - пол витка
            turns = 0.5
            approachAngle = Math.PI
            endRadius = EARTH_RADIUS - 40
            pathLength = Math.PI * (ENEMY_SPAWN_RADIUS + endRadius) / 2
            break
        case 2: // ENEMY_PATHS_MAX - полный оборот
            turns = 1.0
            approachAngle = Math.PI * 1.5
            endRadius = EARTH_RADIUS - 30
            pathLength = Math.PI * (ENEMY_SPAWN_RADIUS + endRadius)
            break
    }
    
    const TOTAL_POINTS = Math.ceil(pathLength)
    const path = new Float32Array(TOTAL_POINTS * 4)
    
    for (let i = 0; i < TOTAL_POINTS; i++) {
        const progress = i / TOTAL_POINTS
        const angle = angleOffset + approachAngle + progress * turns * Math.PI * 2
        const radius = ENEMY_SPAWN_RADIUS - progress * (ENEMY_SPAWN_RADIUS - endRadius)
        
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        
        // Масштабирование
        let scale = 1
        if (i < SCALE_UP_POINTS) {
            scale = i / SCALE_UP_POINTS
        } else if (i > TOTAL_POINTS - SCALE_DOWN_POINTS) {
            scale = (TOTAL_POINTS - i) / SCALE_DOWN_POINTS
        }
        
        // Поворот (касательная)
        const tangentAngle = angle + Math.PI/2 + (type === 0 ? 0 : Math.PI/4)
        
        const index = i * 4
        path[index] = x
        path[index + 1] = y
        path[index + 2] = scale
        path[index + 3] = tangentAngle

        if ( isNaN(path[index]) || isNaN(path[index + 1]) || isNaN(path[index + 2]) || isNaN(path[index + 3]) ) {
            console.error('NaN in index:', index)
        }
    }
    
    return {
        path,
        points: TOTAL_POINTS,
        type,
        variant
    }
}