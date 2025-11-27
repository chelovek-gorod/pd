import { Container, Sprite, Rectangle } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { createEnum } from "../../../utils/functions";
import { SCALE_SIZES, ENEMY_PATHS_MIN, ENEMY_PATHS_MID, ENEMY_PATHS_MAX } from './constants'
import { createOrbitTexture } from "../../../utils/textureGenerator";
import { ORBIT_A, ORBIT_B, ORBIT_LINE } from './constants'
import Earth from "./Earth";
import Asteroid from "./Enemies/Asteroid";
import { images } from "../../../app/assets";
import Mine from "./Guns/Mine";

const STATE = createEnum([
    'MAX',
    'MIN',
    'SCALING_TO_MAX',
    'SCALING_TO_MIN'
])

export default class GameContainer extends Container {
    constructor() {
        super()

        this.minScale = 1
        this.maxScale = 1
        this.state = STATE.MAX

        const orbitDataA = createOrbitTexture(ORBIT_A.radius, ORBIT_LINE.width, ORBIT_LINE.color, ORBIT_LINE.alpha)
        const orbitDataB = createOrbitTexture(ORBIT_B.radius, ORBIT_LINE.width, ORBIT_LINE.color, ORBIT_LINE.alpha)

        this.orbitA = new Sprite(orbitDataA.texture)
        this.orbitA.anchor.set(0.5)
        this.orbitA.scale.set(orbitDataA.scale)

        this.orbitB = new Sprite(orbitDataB.texture)
        this.orbitB.anchor.set(0.5)
        this.orbitB.scale.set(orbitDataB.scale)

        this.addChild(this.orbitA, this.orbitB)

        // containers
        this.planet = new Container()
        this.addChild(this.planet)

        this.shells = new Container()
        this.addChild(this.shells)

        this.guns = new Container()
        this.addChild(this.guns)

        this.enemies = new Container()
        this.addChild(this.enemies)

        this.explosions = new Container()
        this.addChild(this.explosions)

        // fill containers
        this.earth = new Earth()
        this.planet.addChild(this.earth)

        /*
        setTimeout( ()=> {
            const pathData = ENEMY_PATHS_MIN[4]
            const asteroid = new Asteroid(pathData)
            this.enemies.addChild( asteroid )          
        }, 3000)
        */

        this.handleWheel = this.handleWheel.bind(this)
        this.eventMode = 'static'
        this.on('wheel', this.handleWheel)
    }

    screenResize(screenData) {
        tickerRemove(this)

        const minViewSize = screenData.isLandscape ? screenData.height : screenData.width
        this.minScale = Math.min(1, minViewSize / SCALE_SIZES.max)
        this.maxScale = Math.min(1, minViewSize / SCALE_SIZES.min)

        if (this.state === STATE.MIN || this.state === STATE.SCALING_TO_MIN) {
            this.scale.set(this.minScale)
            this.state = STATE.MIN
        } else {
            this.scale.set(this.maxScale)
            this.state = STATE.MAX
        }
    }

    handleWheel(event) {
        event.preventDefault()
        
        const delta = Math.sign(event.deltaY)
        if (delta < 0 ) this.zoomIn()
        else if (delta > 0 )  this.zoomOut()
    }

    zoomIn() {
        // set max scale
        if (this.state === STATE.MAX || this.state === STATE.SCALING_TO_MAX) return

        this.state = STATE.SCALING_TO_MAX
        tickerAdd(this)
    }
 
    zoomOut() {
        // set min scale
        if (this.state === STATE.MIN || this.state === STATE.SCALING_TO_MIN) return

        this.state = STATE.SCALING_TO_MIN
        tickerAdd(this)
    }

    tick(time) {
        const zoomStep = SCALE_SIZES.speed * time.deltaMS

        if (this.state === STATE.SCALING_TO_MIN) {
            this.scale.set( Math.max(this.minScale, this.scale.x - zoomStep) )
            if (this.scale.x === this.minScale) this.state = STATE.MIN
        } else if (this.state === STATE.SCALING_TO_MAX) {
            this.scale.set( Math.min(this.maxScale, this.scale.x + zoomStep) )
            if (this.scale.x === this.maxScale) this.state = STATE.MAX
        } else {
            tickerRemove(this)
        }
    }

    kill() {
        tickerRemove(this)
        this.eventMode = 'none'
        this.off('wheel', this.handleWheel)
    }
}