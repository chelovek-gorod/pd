import { Container } from "pixi.js"
import { EventHub, events } from '../../app/events'
import { tickerAdd, tickerRemove, getAppScreen } from '../../app/application.js'
import { 
    MOVE_DIRECTION,
    ZOOM_DIRECTION, 
    ROTATE_DIRECTION,
    MOVE_SPEED,
    ZOOM_SPEED,
    ROTATE_SPEED,
    RETURN_SPEED,
    MIN_ZOOM,
    MAX_ZOOM,
    SHAKE_DEFAULT_DURATION,
    SHAKE_DEFAULT_AMPLITUDE,
    SHAKE_DEFAULT_COUNT
} from './constants.js'

/**
 * @typedef {Object} FollowController
 * @property {function(Object): void} setTargetPosition - Установить цель для слежения
 * @property {function(): Object|null} getTargetPosition - Получить текущую цель
 * @property {function(): void} clearTargetPosition - Очистить цель слежения
 */

/**
 * @typedef {Object} MovementController
 * @property {function({x: number, y: number}): void} move - Задать направление движения
 * @property {function(): void} stop - Остановить движение
 * @property {function(): {x: number, y: number}} getDirection - Получить текущее направление
 * @property {function(): number} getSpeed - Получить текущую скорость
 */

/**
 * @typedef {Object} ZoomController
 * @property {function(number): void} zoom - Задать направление зума (1 = IN, -1 = OUT)
 * @property {function(): void} stop - Остановить зум
 * @property {function(number): void} set - Установить конкретное значение зума
 * @property {function(): number} getZoom - Получить текущий зум
 * @property {function(): number} getSpeed - Получить текущую скорость зума
 */

/**
 * @typedef {Object} RotationController
 * @property {function(number): void} rotate - Задать направление вращения (1 = RIGHT, -1 = LEFT)
 * @property {function(): void} stop - Остановить вращение
 * @property {function(number): void} set - Установить конкретный угол вращения
 * @property {function(): number} getRotation - Получить текущий угол вращения
 * @property {function(): number} getSpeed - Получить текущую скорость вращения
 */

/**
 * @typedef {Object} ShakeController
 * @property {function(number, number, number, boolean): void} shake - Запустить тряску камеры
 * @property {function(): void} stop - Остановить тряску
 * @property {function(): boolean} isShaking - Проверить активна ли тряска
 */

/**
 * Продвинутая система камеры с поддержкой движения, зума, вращения и тряски
 * @class Camera
 */
export class Camera {
    /**
     * Создает экземпляр камеры
     * @param {Container} gameContainer - Контейнер PIXI, который будет управляться камерой
     */
     constructor(gameContainer) {
        if (!gameContainer) {
            throw new Error('Camera: gameContainer is required')
        }
        /** @private */
        this.gameContainer = gameContainer
        
        // Основное состояние
        /** @private */
        this.x = this._lastX = 0
        /** @private */
        this.y = this._lastY = 0
        /** @private */
        this.zoom = this._lastZoom = 1
        /** @private */
        this.rotation = this._lastRotation = 0
        
        /** @private */
        this.followTarget = null
        /** @private */
        this.returnSpeed = RETURN_SPEED
        
        /** @private */
        this.moveDirection = MOVE_DIRECTION.NONE
        /** @private */
        this.zoomDirection = ZOOM_DIRECTION.NONE
        /** @private */
        this.rotateDirection = ROTATE_DIRECTION.NONE
        
        // Тряска камеры
        /** @private */
        this.isShaking = false
        /** @private */
        this.shakeStartTime = 0
        /** @private */
        this.shakeDuration = 0
        /** @private */
        this.shakeAmplitude = 0
        /** @private */
        this.shakeCount = 0
        /** @private */
        this.shakeOffsetX = this._lastShakeX = 0
        /** @private */
        this.shakeOffsetY = this._lastShakeY = 0
        /** @private */
        this.isFreezePosition = false
        
        /** @private */
        this._cachedViewRadiusSq = 0  // ← ИЗМЕНЕНО: был _cachedViewRadius
        /** @private */
        this._viewRadiusDirty = true
        
        /** @private */
        this._shakeTable = new Float32Array(64)
        for (let i = 0; i < 64; i++) {
            this._shakeTable[i] = Math.sin((i / 64) * Math.PI * 2)
        }
        
        /** @private */
        this.viewportHalfWidth = 400
        /** @private */
        this.viewportHalfHeight = 300
        
        this.screenResize( getAppScreen() )
        
        tickerAdd(this)
        EventHub.on(events.screenResize, this.screenResize, this)
        
        this.updateGameContainer()
    }

    // === КОНТРОЛЛЕРЫ ===
    
    /**
     * Создает контроллер для слежения за целью
     * @param {Object|null} [target=null] - Начальная цель для слежения
     * @returns {FollowController} Контроллер слежения
     */
    createFollowController(target = null) {
        if (target) this.followTarget = target

        return {
            setTargetPosition: (target) => { 
                if (target) this.followTarget = target 
            },
            getTargetPosition: () => this.followTarget,
            clearTargetPosition: () => { 
                this.followTarget = null 
            }
        }
    }
    
    /**
     * Создает контроллер движения камеры
     * @param {number|null} [customSpeed=null] - Кастомная скорость движения
     * @returns {MovementController} Контроллер движения
     */
    createMovementController(customSpeed = null) {
        const speed = this.validateSpeed(customSpeed, MOVE_SPEED)
        
        return {
            move: (direction) => this.moveDirection = direction,
            stop: () => this.moveDirection = MOVE_DIRECTION.NONE,
            getDirection: () => this.moveDirection,
            getSpeed: () => speed
        }
    }
    
    /**
     * Создает контроллер зума камеры
     * @param {number|null} [customSpeed=null] - Кастомная скорость зума
     * @returns {ZoomController} Контроллер зума
     */
    createZoomController(customSpeed = null) {
        const speed = this.validateSpeed(customSpeed, ZOOM_SPEED)
        
        return {
            zoom: (direction) => this.zoomDirection = direction,
            stop: () => this.zoomDirection = ZOOM_DIRECTION.NONE,
            set: (value) => this.setZoom(value),
            getZoom: () => this.zoom,
            getSpeed: () => speed
        }
    }
    
    /**
     * Создает контроллер вращения камеры
     * @param {number|null} [customSpeed=null] - Кастомная скорость вращения
     * @returns {RotationController} Контроллер вращения
     */
    createRotationController(customSpeed = null) {
        const speed = this.validateSpeed(customSpeed, ROTATE_SPEED)
        
        return {
            rotate: (direction) => this.rotateDirection = direction,
            stop: () => this.rotateDirection = ROTATE_DIRECTION.NONE,
            set: (angle) => this.setRotation(angle),
            getRotation: () => this.rotation,
            getSpeed: () => speed
        }
    }
    
    /**
     * Создает контроллер тряски камеры
     * @returns {ShakeController} Контроллер тряски
     */
    createShakeController() {
        return {
            shake: (duration = SHAKE_DEFAULT_DURATION, amplitude = SHAKE_DEFAULT_AMPLITUDE, count = SHAKE_DEFAULT_COUNT, freezePosition = false) => {
                this.startShake(duration, amplitude, count, freezePosition)
            },
            stop: () => {
                this.stopShake()
            },
            isShaking: () => this.isShaking
        }
    }
    
    // === ВАЛИДАЦИЯ ===
    
    /**
     * @private
     */
    validateSpeed(customSpeed, defaultSpeed) {
        if (customSpeed === null || customSpeed === undefined) {
            return defaultSpeed
        }
        
        if (typeof customSpeed !== 'number' || customSpeed <= 0) {
            console.warn(`Camera: Invalid speed ${customSpeed}, using default: ${defaultSpeed}`)
            return defaultSpeed
        }
        
        return customSpeed
    }
    
    /**
     * @private
     */
    validateShakeParams(duration, amplitude, count) {
        const validDuration = typeof duration === 'number' && duration > 0 ? duration : SHAKE_DEFAULT_DURATION
        const validAmplitude = typeof amplitude === 'number' && amplitude > 0 ? amplitude : SHAKE_DEFAULT_AMPLITUDE
        const validCount = typeof count === 'number' && count > 0 ? count : SHAKE_DEFAULT_COUNT
        
        if (duration !== validDuration || amplitude !== validAmplitude || count !== validCount) {
            console.warn('Camera: Invalid shake parameters, using defaults')
        }
        
        return { duration: validDuration, amplitude: validAmplitude, count: validCount }
    }
    
    // === ПРЯМАЯ УСТАНОВКА ===
    
    /**
     * Устанавливает позицию камеры
     * @param {number} x - X координата
     * @param {number} y - Y координата
     */
    setPosition(x, y) {
        if (this.isFreezePosition) return
            
        this.x = x
        this.y = y
        this._viewRadiusDirty = true
        this.updateGameContainer()
    }
    
    /**
     * Устанавливает уровень зума камеры
     * @param {number} zoom - Уровень зума (MIN_ZOOM - MAX_ZOOM)
     */
    setZoom(zoom) {
        if (this.isFreezePosition) return
        
        this.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
        this._viewRadiusDirty = true
        this.updateGameContainer()
    }

    /**
     * Устанавливает угол вращения камеры
     * @param {number} angle - Угол вращения в радианах
     */
    setRotation(angle) {
        if (this.isFreezePosition) return
        
        this.rotation = angle
        this.updateGameContainer()
    }
    
    // === ТРЯСКА КАМЕРЫ ===
    
    /**
     * @private
     */
    startShake(duration, amplitude, count, freezePosition = false) {
        const params = this.validateShakeParams(duration, amplitude, count)
        
        this.isFreezePosition = freezePosition
        this.isShaking = true
        this.shakeStartTime = Date.now()
        this.shakeDuration = params.duration
        this.shakeAmplitude = params.amplitude
        this.shakeCount = params.count
        this.shakeOffsetX = 0
        this.shakeOffsetY = 0
        
        // Останавливаем контроллеры ввода только если позиция заморожена
        if (freezePosition) {
            this.moveDirection = MOVE_DIRECTION.NONE
            this.zoomDirection = ZOOM_DIRECTION.NONE
            this.rotateDirection = ROTATE_DIRECTION.NONE
        }
    }
    
    /**
     * @private
     */
    stopShake() {
        if (!this.isShaking) return
        
        this.isShaking = false
        this.isFreezePosition = false
        this.shakeOffsetX = 0
        this.shakeOffsetY = 0
        this.updateGameContainer()
    }
    
    /**
     * @private
     */
    updateShake() {
        if (!this.isShaking) return
        
        const currentTime = Date.now()
        const elapsed = currentTime - this.shakeStartTime
        const progress = Math.min(elapsed / this.shakeDuration, 1)
        
        // Используем предрассчитанную таблицу вместо Math.sin/cos
        const oscillationProgress = progress * this.shakeCount
        const decay = 1 - progress
        const tableIndex = Math.floor((oscillationProgress % 1) * 64) % 64
        
        this.shakeOffsetX = this._shakeTable[tableIndex] * this.shakeAmplitude * decay
        this.shakeOffsetY = this._shakeTable[(tableIndex + 16) % 64] * this.shakeAmplitude * decay
        
        if (progress >= 1) {
            this.stopShake()
        }
    }
    
    // === ОБНОВЛЕНИЕ (ОПТИМИЗИРОВАННОЕ) ===
    
    /**
     * @private
     */
    tick(time) {
        // Разделение путей для максимальной производительности
        if (this.isShaking) this.tickWithShake(time)
        else this.tickNormal(time)

        this.updateGameContainer()
    }
    
    /**
     * @private
     */
    tickNormal(time) {
        // Новое движение от ввода
        if (this.moveDirection.x !== 0 || this.moveDirection.y !== 0) {
            const cosR = Math.cos(this.rotation)
            const sinR = Math.sin(this.rotation)
    
            // Поворачиваем направление движения в мировые координаты
            const worldDX = this.moveDirection.x * cosR - this.moveDirection.y * sinR
            const worldDY = this.moveDirection.x * sinR + this.moveDirection.y * cosR
    
            this.x += worldDX * MOVE_SPEED * time.deltaMS
            this.y += worldDY * MOVE_SPEED * time.deltaMS
            this._viewRadiusDirty = true
        }
        /*
        // Движение от ввода
        if (this.moveDirection.x !== 0 || this.moveDirection.y !== 0) {
            this.x += this.moveDirection.x * MOVE_SPEED * time.deltaMS
            this.y += this.moveDirection.y * MOVE_SPEED * time.deltaMS
            this._viewRadiusDirty = true
        }
        */
        
        // Возврат к цели
        if (this.followTarget && !this.isOnTarget()) {
            const distanceX = this.followTarget.x - this.x
            const distanceY = this.followTarget.y - this.y
            
            const distanceSquared = distanceX * distanceX + distanceY * distanceY
            const speed = this.returnSpeed * Math.min(distanceSquared * 0.01, 1) * time.deltaMS
            
            this.x += distanceX * speed
            this.y += distanceY * speed
            this._viewRadiusDirty = true
        }
        
        // Зум
        if (this.zoomDirection !== ZOOM_DIRECTION.NONE) {
            this.zoom += this.zoomDirection * ZOOM_SPEED * this.zoom * time.deltaMS
            this.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.zoom))
            this._viewRadiusDirty = true
        }
        
        // Вращение
        if (this.rotateDirection !== ROTATE_DIRECTION.NONE) {
            this.rotation += this.rotateDirection * ROTATE_SPEED * time.deltaMS
        }
    }
    
    /**
     * @private
     */
    tickWithShake(time) {
        // Сначала обычная логика (если не заморожено)
        if (!this.isFreezePosition) {
            this.tickNormal(time)
        }
        
        // Затем тряска
        this.updateShake()
    }
    
    /**
     * @private
     */
    isOnTarget(threshold = 1) {
        if (!this.followTarget) return true
        
        // Оптимизированная проверка без Math.sqrt
        const dx = this.followTarget.x - this.x
        const dy = this.followTarget.y - this.y
        return (dx * dx + dy * dy) < (threshold * threshold)
    }
    
    /**
     * @private
     */
    updateGameContainer() {
        const needsUpdate = 
            this.x !== this._lastX || this.y !== this._lastY ||
            this.zoom !== this._lastZoom || this.rotation !== this._lastRotation ||
            this.shakeOffsetX !== this._lastShakeX || this.shakeOffsetY !== this._lastShakeY

        if (!needsUpdate) return

        const offsetX = this.isShaking ? this.shakeOffsetX : 0;
        const offsetY = this.isShaking ? this.shakeOffsetY : 0;

        // Поворот, зум и смещение должны происходить относительно pivot
        // 1️⃣ Ставим pivot в центр камеры (мировая позиция x,y)
        this.gameContainer.pivot.set(this.x + offsetX, this.y + offsetY);

        // 2️⃣ Позицию контейнера не трогаем — она в (0,0),
        //     потому что Level сам центрирует камеру на экране
        this.gameContainer.position.set(0, 0);

        // 3️⃣ Применяем масштаб и вращение
        this.gameContainer.scale.set(this.zoom);
        this.gameContainer.rotation = -this.rotation;

        this._lastX = this.x;
        this._lastY = this.y;
        this._lastZoom = this.zoom;
        this._lastRotation = this.rotation;
        this._lastShakeX = this.shakeOffsetX;
        this._lastShakeY = this.shakeOffsetY;

        /*
        const needsUpdate = 
            this.x !== this._lastX || this.y !== this._lastY ||
            this.zoom !== this._lastZoom || this.rotation !== this._lastRotation ||
            this.shakeOffsetX !== this._lastShakeX || this.shakeOffsetY !== this._lastShakeY
    
        if (!needsUpdate) return
        
        const offsetX = this.isShaking ? this.shakeOffsetX : 0
        const offsetY = this.isShaking ? this.shakeOffsetY : 0
        
        this.gameContainer.position.set(
            -(this.x + offsetX) * this.zoom, 
            -(this.y + offsetY) * this.zoom
        )
        this.gameContainer.scale.set(this.zoom)
        this.gameContainer.rotation = this.rotation
        
        this._lastX = this.x
        this._lastY = this.y
        this._lastZoom = this.zoom
        this._lastRotation = this.rotation
        this._lastShakeX = this.shakeOffsetX
        this._lastShakeY = this.shakeOffsetY
        */
    }
    
    // === ОБЛАСТЬ ВИДИМОСТИ И SCREEN RESIZE ===
    
    /**
     * @private
     */
    screenResize(screenData) {
        this.viewportHalfWidth = screenData.centerX
        this.viewportHalfHeight = screenData.centerY
        this._viewRadiusDirty = true
        
        this.updateGameContainer()
    }
    
    /**
     * @private
     */
    getViewRadiusSq() {
        if (this._viewRadiusDirty) {
            // ИСПРАВЛЕНО: убрали Math.sqrt, работаем с квадратами
            const halfWidth = this.viewportHalfWidth
            const halfHeight = this.viewportHalfHeight
            this._cachedViewRadiusSq = (halfWidth * halfWidth + halfHeight * halfHeight) / (this.zoom * this.zoom)
            this._viewRadiusDirty = false
        }
        return this._cachedViewRadiusSq
    }
    
    /**
     * Проверяет, видна ли позиция в мире камере
     * @param {number} x - X координата в мире
     * @param {number} y - Y координата в мире  
     * @param {number} [radius=0] - Радиус объекта для расширения зоны видимости
     * @returns {boolean} true если позиция видна камере
     */
    isPositionVisible(x, y, radius = 0) {
        const dx = x - this.x
        const dy = y - this.y
        const distanceSq = dx * dx + dy * dy
        
        const viewRadiusSq = this.getViewRadiusSq()
        const objectRadius = radius * this.zoom
        const totalDistanceSq = viewRadiusSq + objectRadius * objectRadius
            + 2 * Math.sqrt(viewRadiusSq) * objectRadius
        
        return distanceSq < totalDistanceSq
    }
    
    // === УТИЛИТЫ ===
    
    /**
     * Преобразует экранные координаты в мировые с учетом трансформаций камеры
     * @param {number} screenX - X координата на экране (от левого края)
     * @param {number} screenY - Y координата на экране (от верхнего края)  
     * @returns {{x: number, y: number}} Объект с мировыми координатами {x, y}
     */
    getWorldPosition(screenX, screenY) {
        return {
            x: (screenX / this.zoom) + this.x - this.viewportHalfWidth / this.zoom,
            y: (screenY / this.zoom) + this.y - this.viewportHalfHeight / this.zoom
        }
    }
    
    /**
     * Преобразует мировые координаты в экранные с учетом трансформаций камеры
     * @param {number} worldX - X координата в мире
     * @param {number} worldY - Y координата в мире
     * @returns {{x: number, y: number}} Объект с экранными координатами {x, y}
     */
    getScreenPosition(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom + this.viewportHalfWidth,
            y: (worldY - this.y) * this.zoom + this.viewportHalfHeight
        }
    }
    
    /**
     * @private
     */
    kill() {
        tickerRemove(this)
        EventHub.off(events.screenResize, this.screenResize)
    }
}