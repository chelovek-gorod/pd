import { AnimatedSprite, Container, Sprite } from "pixi.js";
import { tickerAdd } from "../../../app/application";
import { atlases, images } from "../../../app/assets";

export default class Earth extends Container {
    constructor() {
        super()

        this.earth = new AnimatedSprite(atlases.earth.animations.rotation_right)
        this.earth.anchor.set(0.5)
        this.earth.animationSpeed = 0.5
        this.earth.play()

        this.smoke = new Sprite(images.earth_smoke)
        this.smoke.anchor.set(0.5)
        this.smoke.alpha = 0

        this.addChild(this.earth, this.smoke)

        tickerAdd(this)
    }

    tick(time) {
        this.smoke.alpha += time.deltaMS * 0.00001
    }
}