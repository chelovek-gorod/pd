import { AnimatedSprite } from "pixi.js";
import { tickerAdd, kill } from "../../../../app/application";
import { atlases } from "../../../../app/assets";
import { setCursorPointer } from "../../../../utils/functions";
import { ORBIT_mines } from "../constants";

export default class Mine extends AnimatedSprite {
    constructor(orbitIndex, destroyCallback) {
        super(atlases.gun_mine.animations.rotation)
        this.anchor.set(0.5)
        this.animationSpeed = 0.5
        this.play()

        this.destroyCallback = destroyCallback
        
        this.speed = ORBIT_mines.speed
        this.orbitIndex = orbitIndex
        this.orbitFraction = 0
        this.targetPosition = null
        this.targetFraction = 0
        this.speedMultiplier = 1
        this.orbitPath = ORBIT_mines.path
        this.orbitPathSize = ORBIT_mines.pathSize

        this.targetSpeedMultiplier = 1
        this.acceleration = 0.1
        
        this.applyPosition()

        setCursorPointer(this)
        this.on('pointerdown', this.getClick, this)

        tickerAdd(this)
    }

    updateTarget(targetPosition) {
        this.targetPosition = targetPosition
        
        if (this.targetPosition === null) {
            this.targetSpeedMultiplier = 1
            return
        }
        
        let diff = this.targetPosition - this.orbitIndex
        if (diff < 0) diff += this.orbitPathSize
        
        const maxDistance = this.orbitPathSize * 0.75
        const maxSpeedMultiplier = 3.0
        const distanceRatio = Math.min(diff / maxDistance, 1.0)
        this.targetSpeedMultiplier = 1 + (maxSpeedMultiplier - 1) * distanceRatio
    }

    applyPosition() {
        const index = Math.floor(this.orbitIndex) % this.orbitPathSize
        const pathIndex = index * 4
        this.position.set(this.orbitPath[pathIndex], this.orbitPath[pathIndex + 1])
        this.scale.set(this.orbitPath[pathIndex + 2])
    }

    // НОВЫЙ МЕТОД - корректная круговая проверка достижения цели
    checkCircularReach(current, next, target) {
        if (current <= next) {
            // Обычный случай - движемся вперед без перехода через 0
            return target >= current && target <= next
        } else {
            // Переход через 0 - цель может быть в начале или конце
            return target >= current || target <= next
        }
    }

    tick(time) {
        // Плавно меняем скорость ВСЕГДА когда есть цель или скорость не стабилизировалась
        if (this.targetPosition !== null || Math.abs(this.speedMultiplier - this.targetSpeedMultiplier) > 0.001) {
            const acceleration = this.acceleration * time.deltaMS
            this.speedMultiplier += (this.targetSpeedMultiplier - this.speedMultiplier) * acceleration
        }
    
        // 1. Двигаем цель если есть
        if (this.targetPosition !== null) {
            const targetMovement = ORBIT_mines.speed * time.deltaMS + this.targetFraction
            const targetPath = Math.floor(targetMovement)
            this.targetFraction = targetMovement - targetPath
            this.targetPosition = (this.targetPosition + targetPath) % this.orbitPathSize
            
            // ПЛАВНОЕ ТОРМОЖЕНИЕ ПРИ ПРИБЛИЖЕНИИ К ЦЕЛИ
            let diff = this.targetPosition - this.orbitIndex
            if (diff < 0) diff += this.orbitPathSize
            
            const brakingDistance = this.orbitPathSize * 0.1
            if (diff < brakingDistance) {
                const brakeRatio = diff / brakingDistance
                this.targetSpeedMultiplier = 1 + (3.0 - 1) * brakeRatio
            }
        }
    
        // 2. Двигаем мину
        const mineMovement = ORBIT_mines.speed * this.speedMultiplier * time.deltaMS + this.orbitFraction
        const minePath = Math.floor(mineMovement)
        this.orbitFraction = mineMovement - minePath
    
        if (this.targetPosition === null) {
            // Без цели - просто движемся
            this.orbitIndex = (this.orbitIndex + minePath) % this.orbitPathSize
        } else {
            // С целью - движемся и проверяем достижение
            const nextOrbitIndex = this.orbitIndex + minePath
            const targetIndex = Math.floor(this.targetPosition)
            
            // ИСПРАВЛЕННАЯ ПРОВЕРКА - используем круговую логику
            const hasReached = this.checkCircularReach(this.orbitIndex, nextOrbitIndex, targetIndex)
    
            if (hasReached) {
                // Достигли цели
                const overshoot = nextOrbitIndex - targetIndex
                this.orbitIndex = this.targetPosition
                this.orbitFraction += overshoot
                this.targetPosition = null
                this.targetSpeedMultiplier = 1
            } else {
                // Не достигли
                this.orbitIndex = nextOrbitIndex % this.orbitPathSize
            }
        }
        
        this.applyPosition()
    }

    getClick() {
        kill(this)
    }

    kill() {
        if (this.destroyCallback) {
            this.destroyCallback(this)
        }
    }
}