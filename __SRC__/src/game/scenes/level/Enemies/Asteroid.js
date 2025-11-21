import { AnimatedSprite } from "pixi.js";
import { kill, tickerAdd } from "../../../../app/application";
import { atlases } from "../../../../app/assets";
import AsteroidRock from "./AsteroidRock";

export default class Asteroid extends AnimatedSprite {
    constructor(pathData, maxScale = 1) {
        super(atlases.asteroid.animations.go)
        this.anchor.set(0.5)
        this.animationSpeed = 0.5
        this.play()

        this.maxScale = 0.5 + Math.random() * 0.5

        this.path = pathData.path
        this.pathSize = pathData.points

        this.destroyIndex = this.pathSize * 0.7 + Math.floor(Math.random() * this.pathSize)
        
        this.pathIndex = 0
        this.pathFraction = 0
        this.speed = 0.05 + Math.random() * 0.05
        this.lastScale = null
        this.isOnStart = true
        
        this.updatePosition()
        
        tickerAdd(this)
    }

    updatePosition() {
        const baseIndex = this.pathIndex * 4
        this.position.set(this.path[baseIndex], this.path[baseIndex + 1])
        this.lastScale = Math.max(0.01, this.path[baseIndex + 2])
        this.scale.set(this.lastScale * this.maxScale)
        this.rotation = this.path[baseIndex + 3]
    }

    acceleration(deltaMS) { 
        const movement = this.lastScale * this.speed * deltaMS + this.pathFraction
        const path = Math.floor(movement)
        this.pathFraction = movement - path
        this.pathIndex += path
        if (this.lastScale > 0.995 ) this.isOnStart = false
    }

    move(deltaMS) {
        const movement = this.speed * deltaMS + this.pathFraction
        const path = Math.floor(movement)
        this.pathFraction = movement - path
        this.pathIndex += path
    }

    explosion() {
        const rocksCount = 5
        const angleStep = (Math.PI + Math.PI) / rocksCount
        const startAngle = angleStep * Math.random()
        const angleRate = angleStep * 0.5
        for(let i = 0; i < rocksCount; i++) {
            const direction = startAngle + angleStep * i + angleRate * Math.random()
            this.parent.addChild( new AsteroidRock(this.x, this.y, this.scale.x, direction) )
        }
        kill(this)
    }

    tick(time) {
        if (this.isOnStart) this.acceleration(time.deltaMS)
        else this.move(time.deltaMS)

        this.updatePosition()

        if (this.pathIndex >= this.pathSize) return kill(this)
        if (this.pathIndex >= this.destroyIndex) return this.explosion()
    }
}