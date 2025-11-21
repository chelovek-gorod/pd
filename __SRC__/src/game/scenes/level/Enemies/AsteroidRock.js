import { AnimatedSprite } from "pixi.js";
import { kill, tickerAdd } from "../../../../app/application";
import { atlases } from "../../../../app/assets";
import { EARTH_RADIUS } from "../constants";

export default class AsteroidRock extends AnimatedSprite {
    constructor(x, y, scale, direction) {
        super(atlases.asteroid_rock.animations.go)
        this.anchor.set(0.5)
        this.scale.set(scale)
        this.animationSpeed = 0.5
        this.play()

        this.position.set(x, y)
        this.rotation = direction

        this.speed = 0.05 + Math.random() * 0.05
        this.direction = direction

        
        
        this.distanceToEarth = this.getDistanceToEarth()
        this.scaleStep = this.distanceToEarth ? scale / this.distanceToEarth : 0.0006
        
        tickerAdd(this)
    }

    getDistanceToEarth() {
        const dirX = Math.cos(this.direction)
        const dirY = Math.sin(this.direction)
        
        const projection = -(this.x * dirX + this.y * dirY)
        
        if (projection < 0) return null
        
        const closestX = this.x + dirX * projection
        const closestY = this.y + dirY * projection
        
        const minDistance = Math.hypot(closestX, closestY)
        
        return minDistance <= EARTH_RADIUS ? minDistance : null
    }

    tick(time) {
        const pathSize = this.speed * time.deltaMS
        const scale = this.scale.x - pathSize * this.scaleStep
        if (scale < 0) return kill(this)
        this.scale.set(scale)
        this.x += Math.cos(this.direction) * pathSize
        this.y += Math.sin(this.direction) * pathSize
    }
}