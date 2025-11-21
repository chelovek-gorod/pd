import { Container, DisplacementFilter, Sprite } from "pixi.js"
import { tickerAdd } from "../../../app/application"
import { images } from "../../../app/assets"

export default class Sun extends Container {
    constructor() {
        super()

        this.image = new Sprite(images.sun_red)
        this.image.anchor.set(0.5)
        this.addChild(this.image)

        this.DPFilterSprite = new Sprite(images.dp_filter)
        this.DPFilterSprite.scale = 2
        this.DPFilterSprite.texture.source.style.addressMode = 'repeat'
        this.addChild(this.DPFilterSprite)

        this.DPFilter = new DisplacementFilter(this.DPFilterSprite)
        this.image.filters = [this.DPFilter]

        tickerAdd(this)
    }

    tick(time) {
        this.DPFilterSprite.position.x += time.elapsedMS * 0.02
        this.DPFilterSprite.position.y += time.elapsedMS * 0.02
    }
}