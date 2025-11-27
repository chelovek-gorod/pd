import { AnimatedSprite, Container, Sprite } from "pixi.js"
import { kill, tickerAdd } from "../../../../app/application";
import { atlases } from "../../../../app/assets"
import { createEnum, getDistance, moveToTarget } from "../../../../utils/functions";
import { ORBIT_A, LAUNCH_PATH_A, LAUNCH_PATH_B, ORBIT_B, ORBIT_mines } from '../constants'
import Smoke from "../effects/Smoke";

const STATE = createEnum(['ON_LAUNCH', 'ON_ORBIT'])

const FLY = {
    startSpeed: 0.001,
    maxSpeed:   0.2,
    framesToMaxSpeed: 180,
    addSpeed: 0,
    smokeTimeout: 60,
    smokeEngineOffset: 48
}
FLY.addSpeed = (FLY.maxSpeed - FLY.startSpeed) / FLY.framesToMaxSpeed

class Engine extends Sprite {
    constructor(x, y, scale, direction) {
        super(atlases.launch_vehicle.textures.body)
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
    constructor( targetSatellite, isMine = false ) {
        super()

        this.isMine = isMine
        this.isWithEngine = true

        this.fire1 = new AnimatedSprite(atlases.fire.animations.burn)
        this.fire1.anchor.set(0.87, 0.5)
        this.fire1.position.set(-106, -15)
        this.fire1.alpha = 0.7
        this.fire1.gotoAndPlay(0)

        this.fire2 = new AnimatedSprite(atlases.fire.animations.burn)
        this.fire2.anchor.set(0.87, 0.5)
        this.fire2.position.set(-109, 9)
        this.fire2.alpha = 0.7
        this.fire2.gotoAndPlay(4)

        this.fire0 = new AnimatedSprite(atlases.fire.animations.burn)
        this.fire0.anchor.set(0.87, 0.5)
        this.fire0.position.set(-106, 0)
        this.fire0.alpha = 0.7
        this.fire0.gotoAndPlay(8)

        this.fire3 = new AnimatedSprite(atlases.fire.animations.burn)
        this.fire3.anchor.set(0.87, 0.5)
        this.fire3.position.set(-90, -9)
        this.fire3.alpha = 0.8
        this.fire3.gotoAndPlay(16)

        this.fire4 = new AnimatedSprite(atlases.fire.animations.burn)
        this.fire4.anchor.set(0.87, 0.5)
        this.fire4.position.set(-99, 13)
        this.fire4.alpha = 0.8
        this.fire4.gotoAndPlay(20)

        this.smokeTimeout = FLY.smokeTimeout

        this.body = new Sprite(atlases.launch_vehicle.textures.body)
        this.body.anchor.set(0.5)
        this.head = new Sprite(atlases.launch_vehicle.textures.head)
        this.head.anchor.set(0.5)
        this.addChild(this.fire4, this.fire3, this.fire0, this.fire2, this.fire1, this.body, this.head)

        this.scale.set(0)

        const launchPath = targetSatellite.orbit.launchPath

        this.targetSatellite = targetSatellite
        this.path = launchPath.path 
        this.pathSize = launchPath.pathSize
        this.dropEngineIndex = launchPath.dropEngineIndex
        this.nearestOrbitPointIndex = launchPath.nearestOrbitPointIndex
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

        if (this.body && this.pathIndex > this.dropEngineIndex) this.removeEngine()

        // still on launch
        if (this.pathIndex < this.pathSize) return this.updatePosition()

        if (this.isMine) { 
            if (this.isWithEngine) this.removeEngine()
            return this.onTargetReached()
        }

        // on orbit
        this.state = STATE.ON_ORBIT
        this.pathIndex = this.nearestOrbitPointIndex
        this.path = this.targetSatellite.orbit.path
        this.pathSize = this.targetSatellite.orbit.pathSize
        this.pathFraction = 0

        this.updatePosition()
    }

    removeEngine() {
        this.parent.addChild( new Engine(this.x, this.y, this.scale.x, this.rotation) )
        this.removeChild(this.body, this.fire1, this.fire2, this.fire3, this.fire4)
        this.body.destroy({children: true})
        this.fire1.destroy({children: true})
        this.fire2.destroy({children: true})
        this.fire3.destroy({children: true})
        this.fire4.destroy({children: true})
        this.body = null
        this.fire1 = null
        this.fire2 = null
        this.fire3 = null
        this.fire4 = null
        this.fire0.position.set(20, 0)
        this.parent.parent.enemies.addChild(this)
        this.isWithEngine = false

        this.parent.addChild( new Smoke(this.x, this.y, this.scale.x, true) )
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

    hasReachedTarget(nextPathIndex) { console.log('DONE')
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
        this.targetSatellite.addGun(this.x, this.y)
        this.parent.addChild( new Smoke(this.x, this.y, 1, true) )
        kill(this)
    }

    tick(time) {
        this.smokeTimeout -= time.deltaMS
        if (this.smokeTimeout < 0) {
            this.smokeTimeout += FLY.smokeTimeout

            const x = this.isWithEngine ? this.x - Math.cos(this.rotation) * FLY.smokeEngineOffset : this.x
            const y = this.isWithEngine ? this.y - Math.sin(this.rotation) * FLY.smokeEngineOffset : this.y
            this.parent.parent.shells.addChild( new Smoke(x, y, this.scale.x * 2))
        }

        if (this.state === STATE.ON_LAUNCH) this.onLaunch(time.deltaMS)
        else this.onOrbit(time.deltaMS)
    }
}