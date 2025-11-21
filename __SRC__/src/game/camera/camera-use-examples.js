import { kill } from '../../app/application.js'
import { Camera } from './Camera.js'
import { MOVE_DIRECTION, ZOOM_DIRECTION, ROTATE_DIRECTION } from './constants.js'

// === ПРИМЕР 1: БАЗОВОЕ ИСПОЛЬЗОВАНИЕ ===
export function setupBasicCamera(gameContainer, player) {
    const camera = new Camera(gameContainer)
    
    // Создаем контроллеры
    const followController = camera.createFollowController(player.position)
    const movementController = camera.createMovementController()
    const zoomController = camera.createZoomController()
    const rotationController = camera.createRotationController()
    const shakeController = camera.createShakeController()
    
    return {
        camera,
        controllers: {
            follow: followController,
            movement: movementController,
            zoom: zoomController,
            rotation: rotationController,
            shake: shakeController
        }
    }
}

// === ПРИМЕР 2: УМНОЕ УПРАВЛЕНИЕ С КЛАВИАТУРЫ ===
export function setupSmartKeyboardCamera(gameContainer, player) {
    const { camera, controllers } = setupBasicCamera(gameContainer, player)
    
    // InputManager для обработки комбинаций клавиш
    class InputManager {
        constructor() {
            this.activeDirections = new Set()
        }
        
        keyDown(direction) {
            this.activeDirections.add(direction)
            this.updateCameraDirection()
        }
        
        keyUp(direction) {
            this.activeDirections.delete(direction)
            this.updateCameraDirection()
        }
        
        updateCameraDirection() {
            let x = 0, y = 0
            
            // Суммируем все активные направления
            for (let dir of this.activeDirections) {
                x += MOVE_DIRECTION[dir].x
                y += MOVE_DIRECTION[dir].y
            }
            
            // Нормализация (опционально)
            if (x !== 0 || y !== 0) {
                const length = Math.sqrt(x * x + y * y)
                x /= length
                y /= length
            }
            
            controllers.movement.move({ x, y })
        }
    }
    
    const inputManager = new InputManager()
    
    // Настройка обработчиков
    function setupKeyboardListeners() {
        const keyMap = {
            'ArrowUp': 'UP',
            'ArrowDown': 'DOWN', 
            'ArrowLeft': 'LEFT',
            'ArrowRight': 'RIGHT'
        }
        
        window.addEventListener('keydown', (e) => {
            const direction = keyMap[e.key]
            if (direction) {
                inputManager.keyDown(direction)
            }
            
            // Зум и вращение
            if (e.key === '=' || e.key === '+') {
                controllers.zoom.zoom(ZOOM_DIRECTION.IN)
            }
            if (e.key === '-' || e.key === '_') {
                controllers.zoom.zoom(ZOOM_DIRECTION.OUT)
            }
            if (e.key === ',' || e.key === 'б') {
                controllers.rotation.rotate(ROTATE_DIRECTION.LEFT)
            }
            if (e.key === '.' || e.key === 'ю') {
                controllers.rotation.rotate(ROTATE_DIRECTION.RIGHT)
            }
            if (e.key === ' ') {
                controllers.shake.shake(1000, 5, 10, false)
            }
        })
        
        window.addEventListener('keyup', (e) => {
            const direction = keyMap[e.key]
            if (direction) {
                inputManager.keyUp(direction)
            }
            
            // Останавливаем зум и вращение
            if (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '_') {
                controllers.zoom.stop()
            }
            if (e.key === ',' || e.key === 'б' || e.key === '.' || e.key === 'ю') {
                controllers.rotation.stop()
            }
        })
    }
    
    setupKeyboardListeners()
    
    return { camera, controllers, inputManager }
}

// === ПРИМЕР 3: КАМЕРА ДЛЯ КАТСЦЕН ===
export function setupCutsceneCamera(gameContainer) {
    const camera = new Camera(gameContainer)
    const controllers = {
        movement: camera.createMovementController(),
        zoom: camera.createZoomController(),
        rotation: camera.createRotationController(),
        shake: camera.createShakeController(),
        follow: camera.createFollowController()
    }
    
    // Анимации для катсцен
    const animations = {
        // Плавное перемещение к точке
        moveTo: (targetX, targetY, duration = 1000, onComplete = null) => {
            const startX = camera.x
            const startY = camera.y
            const startTime = Date.now()
            
            function animate() {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / duration, 1)
                
                // Квадратичная плавность
                const easeProgress = 1 - (1 - progress) * (1 - progress)
                
                camera.x = startX + (targetX - startX) * easeProgress
                camera.y = startY + (targetY - startY) * easeProgress
                
                if (progress < 1) {
                    requestAnimationFrame(animate)
                } else if (onComplete) {
                    onComplete()
                }
            }
            
            animate()
        },
        
        // Плавный зум
        zoomTo: (targetZoom, duration = 1000, onComplete = null) => {
            const startZoom = camera.zoom
            const startTime = Date.now()
            
            function animate() {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / duration, 1)
                const easeProgress = 1 - (1 - progress) * (1 - progress)
                
                camera.zoom = startZoom + (targetZoom - startZoom) * easeProgress
                
                if (progress < 1) {
                    requestAnimationFrame(animate)
                } else if (onComplete) {
                    onComplete()
                }
            }
            
            animate()
        },
        
        // Драматическая тряска
        dramaticShake: () => {
            controllers.shake.shake(2000, 10, 20, true)
        }
    }
    
    return { camera, controllers, animations }
}

// === ПРИМЕР 4: КАМЕРА ДЛЯ БОЕВОЙ СИСТЕМЫ ===
export function setupCombatCamera(gameContainer, player) {
    const { camera, controllers } = setupBasicCamera(gameContainer, player)
    
    // Система событий для боевки
    const combatEvents = {
        onPlayerHit: (damage, source) => {
            const intensity = Math.min(damage / 20, 1)
            controllers.shake.shake(
                800 + intensity * 700,
                3 + intensity * 7,
                10,
                false // Не замораживаем - продолжаем следить за игроком
            )
        },
        
        onHeavyAttack: () => {
            controllers.shake.shake(1200, 12, 15, false)
        },
        
        onExplosion: (x, y, power) => {
            const dx = x - camera.x
            const dy = y - camera.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const intensity = Math.max(0, 1 - distance / 300) * (power / 50)
            
            if (intensity > 0.2) {
                controllers.shake.shake(1000, intensity * 15, 12, false)
            }
        },
        
        onBossDeath: () => {
            // Мощная тряска при смерти босса
            controllers.shake.shake(3000, 20, 25, true) // Замораживаем для драматизма
        }
    }
    
    return { camera, controllers, combatEvents }
}

// === ПРИМЕР 5: ИНТЕГРАЦИЯ С LEVEL КЛАССОМ ===
export function integrateCameraIntoLevel(levelInstance, player) {
    // Создаем камеру
    const camera = new Camera(levelInstance.gameContainer)
    
    // Сохраняем контроллеры в уровне
    levelInstance.camera = camera
    levelInstance.cameraControllers = {
        follow: camera.createFollowController(player.position),
        movement: camera.createMovementController(),
        zoom: camera.createZoomController(),
        rotation: camera.createRotationController(),
        shake: camera.createShakeController()
    }
    
    // Добавляем методы для удобства
    levelInstance.shakeCamera = (duration, amplitude, count, freeze = false) => {
        levelInstance.cameraControllers.shake.shake(duration, amplitude, count, freeze)
    }
    
    levelInstance.stopCameraShake = () => {
        levelInstance.cameraControllers.shake.stop()
    }
    
    levelInstance.setCameraTarget = (target) => {
        levelInstance.cameraControllers.follow.setTargetPosition(target)
    }
    
    levelInstance.clearCameraTarget = () => {
        levelInstance.cameraControllers.follow.clearTargetPosition()
    }
    
    // Обновляем screenResize
    const originalScreenResize = levelInstance.screenResize
    levelInstance.screenResize = function(screenData) {
        originalScreenResize.call(this, screenData)
        if (this.camera) {
            this.camera.screenResize(screenData)
        }
    }
    
    // Добавляем cleanup
    const originalKill = levelInstance.kill
    levelInstance.kill = function() {
        if (this.camera) kill( this.camera )
        originalKill.call(this)
    }
    
    return levelInstance
}

// === ЭКСПОРТ ВСЕХ ПРИМЕРОВ ===
export default {
    setupBasicCamera,
    setupSmartKeyboardCamera,
    setupCutsceneCamera,
    setupCombatCamera,
    integrateCameraIntoLevel
}