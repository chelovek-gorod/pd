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

        this.destroyIndex = this.pathSize + 100 // this.pathSize * 0.7 + Math.floor(Math.random() * this.pathSize)
        
        this.pathIndex = 0
        this.pathFraction = 0
        this.speed = 0.2 + Math.random() * 0.05
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
        const prevIndex = this.pathIndex

        const movement = this.speed * time.deltaMS + this.pathFraction
        const path = Math.floor(movement)
        this.pathFraction = movement - path
        this.pathIndex += path

        this.updatePosition()

        // Отладочная информация
    if (prevIndex !== this.pathIndex) {
        const prevX = this.path[prevIndex * 4]
        const prevY = this.path[prevIndex * 4 + 1]
        const currX = this.path[this.pathIndex * 4]
        const currY = this.path[this.pathIndex * 4 + 1]
        const distance = Math.sqrt((currX - prevX) ** 2 + (currY - prevY) ** 2)
        console.log(`Пройдено точек: ${this.pathIndex - prevIndex}, расстояние: ${distance.toFixed(2)}`)
    }


        if (this.pathIndex >= this.pathSize) return kill(this)
        if (this.pathIndex >= this.destroyIndex) return this.explosion()
    }
}