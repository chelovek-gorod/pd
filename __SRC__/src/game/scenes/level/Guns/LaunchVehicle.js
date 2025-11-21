import { AnimatedSprite, Container, Sprite } from "pixi.js"
import { kill, tickerAdd } from "../../../../app/application";
import { atlases } from "../../../../app/assets"
import { createEnum, getDistance, moveToTarget } from "../../../../utils/functions";
import { ORBIT_A, LAUNCH_PATH_A, LAUNCH_PATH_B } from '../constants'

const STATE = createEnum(['ON_LAUNCH', 'ON_ORBIT'])

const FLY = {
    startSpeed: 0.001,
    maxSpeed:   0.2,
    framesToMaxSpeed: 180,
    addSpeed: 0,
}
FLY.addSpeed = (FLY.maxSpeed - FLY.startSpeed) / FLY.framesToMaxSpeed

class Engine extends Sprite {
    constructor(x, y, scale, direction) {
        super(atlases.launch_vehicle.textures.engine)
        this.anchor.set(0.25, 0.5)
        this.position.set(x, y)
        this.scale.set(scale)
        this.rotation = direction
        this.target = {x:0, y:0}
        this.scaleStep = scale / getDistance(this, this.target)
        this.speed = 0.03
        this.rotationSpeed = 0.001

        tickerAdd(this)
    }

    tick(time) {
        this.rotation += this.rotationSpeed * time.deltaMS
        const path = this.speed * time.deltaMS
        this.scale.set(this.scale.x - path * this.scaleStep)
        const isOnTarget = moveToTarget(this, this.target, path)
        //console.log(this.position.x, this.position.y)
        if (isOnTarget) kill(this)
    }
}

export default class LaunchVehicle extends Container {
    constructor( targetSatellite ) {
        super()

        this.isWithEngine = true
        this.fire = new AnimatedSprite(atlases.fire.animations.burn)
        this.fire.anchor.set(0.5, 1)
        this.fire.rotation = -Math.PI * 0.5
        this.fire.position.set(-42, 0)
        this.fire.alpha = 0.8
        this.fire.scale.set(0.7)
        this.fire.play()
        this.engine = new Sprite(atlases.launch_vehicle.textures.engine)
        this.engine.anchor.set(0.5)
        this.head = new Sprite(atlases.launch_vehicle.textures.head)
        this.head.anchor.set(0.5)
        this.addChild(this.fire, this.engine, this.head)

        this.scale.set(0)

        const isOrbitA = targetSatellite.orbit === ORBIT_A
        this.targetSatellite = targetSatellite
        this.path = isOrbitA ? LAUNCH_PATH_A.path : LAUNCH_PATH_B.path 
        this.pathSize = isOrbitA ? LAUNCH_PATH_A.pathSize : LAUNCH_PATH_B.pathSize
        this.dropEngineIndex = isOrbitA ? this.pathSize * 0.5 : this.pathSize * 0.25 
        this.speed = FLY.startSpeed
        this.state = STATE.ON_LAUNCH
        this.pathIndex = 0
        this.pathFraction = 0
        
        tickerAdd(this)
    }

    updatePosition() {
        const pathIndex = this.pathIndex * 4
        this.position.set(this.path[pathIndex], this.path[pathIndex + 1])
        this.scale.set(this.path[pathIndex + 2])
        this.rotation = this.path[pathIndex + 3]
    }

    onLaunch(deltaTime) {
        this.speed = Math.min(FLY.maxSpeed, this.speed + FLY.addSpeed * deltaTime)
        const movement = this.speed * deltaTime + this.pathFraction
        const path = Math.floor(movement)
        this.pathFraction = movement - path
        this.pathIndex += path

        if (this.engine && this.pathIndex > this.dropEngineIndex) this.removeEngine()

        // still on launch
        if (this.pathIndex < this.pathSize) return this.updatePosition()

        // on orbit
        this.state = STATE.ON_ORBIT
        this.pathIndex -= this.pathSize
        this.path = this.targetSatellite.orbit.path
        this.pathSize = this.targetSatellite.orbit.pathSize
        this.pathFraction = 0

        this.updatePosition()
    }

    removeEngine() {
        this.parent.addChild( new Engine(this.x, this.y, this.scale.x, this.rotation) )
        this.removeChild(this.engine)
        this.engine.destroy({children: true})
        this.engine = null
        this.fire.position.set(20, 0)
        this.parent.parent.enemies.addChild(this)
    }

    onOrbit(deltaTime) {
        const movement = this.speed * deltaTime + this.pathFraction
        const path = Math.floor(movement)
        this.pathFraction = movement - path
        
        const nextPathIndex = (this.pathIndex + path) % this.pathSize
        
        if (this.hasReachedTarget(nextPathIndex)) return this.onTargetReached()

        this.pathIndex = nextPathIndex
        this.updatePosition()
    }

    hasReachedTarget(nextPathIndex) {
        if (!this.targetSatellite) return false
    
        if (nextPathIndex >= this.pathIndex) {
            // Обычный случай без перехода через 0
            if (this.targetSatellite.orbitIndex >= this.pathIndex && 
                this.targetSatellite.orbitIndex <= nextPathIndex) {
                return true
            }
        } else {
            // Случай с переходом через 0 (nextPathIndex < this.pathIndex)
            if (this.targetSatellite.orbitIndex >= this.pathIndex || 
                this.targetSatellite.orbitIndex <= nextPathIndex) {
                return true
            }
        }
        
        return false
    }

    onTargetReached() {
        this.targetSatellite.addGun()
        kill(this)
    }

    tick(time) {
        if (this.state === STATE.ON_LAUNCH) this.onLaunch(time.deltaMS)
        else this.onOrbit(time.deltaMS)
    }
}