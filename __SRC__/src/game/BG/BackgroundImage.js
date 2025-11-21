import { Sprite } from 'pixi.js'
import { getAppScreen } from '../../app/application'

export default class BackgroundImage extends Sprite {
    constructor(image) {
        super(image)

        this.bgWidth = image.width
        this.bgHeight = image.height
        this.anchor.set(0.5)
    }

    screenResize(screenData) {
        const scaleBg = Math.max(0.5, screenData.isLandscape
            ? screenData.width / this.bgWidth
            : screenData.height / this.bgHeight
        )
        this.bg.scale.set(scaleBg)
    }

    setTexture(image) {
        this.texture = image
        this.bgWidth = image.width
        this.bgHeight = image.height
        this.anchor.set(0.5)
        screenResize(getAppScreen())
    }

    kill() {
        this.destroy()
    }
}