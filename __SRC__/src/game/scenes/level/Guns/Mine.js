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
        
        this.applyPosition()

        setCursorPointer(this)
        this.on('pointerdown', this.getClick, this)

        tickerAdd(this)
    }

    updateTarget(targetPosition) {
        this.targetPosition = targetPosition
        
        if (this.targetPosition === null) {
            this.speedMultiplier = 1
            return
        }
        
        let diff = this.targetPosition - this.orbitIndex
        if (diff < 0) diff += this.orbitPathSize
        
        const maxDistance = this.orbitPathSize * 0.75
        const maxSpeedMultiplier = 3.0
        const distanceRatio = Math.min(diff / maxDistance, 1.0)
        this.speedMultiplier = 1 + (maxSpeedMultiplier - 1) * distanceRatio

        console.log('Mine diff:', diff, 'speed:', this.speedMultiplier.toFixed(2))
    }

    applyPosition() {
        const index = Math.floor(this.orbitIndex) % this.orbitPathSize
        const pathIndex = index * 4
        this.position.set(this.orbitPath[pathIndex], this.orbitPath[pathIndex + 1])
        this.scale.set(this.orbitPath[pathIndex + 2])
    }

    tick(time) {
        // 1. Двигаем цель если есть
        if (this.targetPosition !== null) {
            const targetMovement = ORBIT_mines.speed * time.deltaMS + this.targetFraction
            const targetPath = Math.floor(targetMovement)
            this.targetFraction = targetMovement - targetPath
            this.targetPosition = (this.targetPosition + targetPath) % this.orbitPathSize
        }
    
        // 2. Двигаем мину
        const mineMovement = ORBIT_mines.speed * this.speedMultiplier * time.deltaMS + this.orbitFraction
        const minePath = Math.floor(mineMovement)
        this.orbitFraction = mineMovement - minePath
    
        if (this.speedMultiplier === 1) {
            // Без цели - просто движемся
            this.orbitIndex = (this.orbitIndex + minePath) % this.orbitPathSize
        } else {
            // С целью - движемся и проверяем достижение
            const nextOrbitIndex = this.orbitIndex + minePath
            const targetIndex = Math.floor(this.targetPosition)
            
            const hasReached = (nextOrbitIndex >= this.orbitIndex) ?
                (targetIndex >= this.orbitIndex && targetIndex <= nextOrbitIndex) :
                (targetIndex >= this.orbitIndex || targetIndex <= nextOrbitIndex)
    
            if (hasReached) {
                // Достигли цели
                const overshoot = nextOrbitIndex - targetIndex
                this.orbitIndex = this.targetPosition
                this.orbitFraction += overshoot
                this.targetPosition = null
                this.speedMultiplier = 1
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