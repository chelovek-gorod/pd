import { AnimatedSprite } from "pixi.js"
import { kill } from "../../../../app/application";
import { atlases } from "../../../../app/assets"

export default class Smoke extends AnimatedSprite {
    constructor( x, y, scale = 1, isBig = false ) {
        super(isBig ? atlases.smoke_192.animations.effect : atlases.smoke.animations.effect)
        this.anchor.set(0.5)
        this.scale.set(scale)
        this.alpha = isBig ? 1 : 0.25
        this.position.set(x, y)
        this.animationSpeed = isBig ? 0.5 :  0.1
        this.loop = false
        this.play()
        this.onComplete = () => kill(this)
    }
}