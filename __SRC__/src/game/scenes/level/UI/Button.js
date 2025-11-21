import { Container, Text, Sprite } from "pixi.js"
import { images, sounds } from "../../../../app/assets"
import { removeCursorPointer, setCursorPointer } from "../../../../utils/functions"
import { styles } from "../../../../app/styles"
import { playSound } from "../../../../app/sound"
import { getRRTextureWithShadow } from "../../../../utils/textureGenerator"
import { BUTTON } from "./constants"

const defaultShadowData = {
    width: BUTTON.width,
    height: BUTTON.height,
    borderRadius: BUTTON.borderRadius,
    color: 0x000000,
    offsetX: 0,
    offsetY: 0,
    alpha: 0.5,
    blur: 8
}

export default class Button extends Container {
    constructor(texture, callback, isActive = true, shadowData = defaultShadowData) {
        super()

        this.callback = callback

        if (shadowData) {
            this.shadow = new Sprite()
            const [texture, padding] = getRRTextureWithShadow(
                BUTTON.width, BUTTON.height, BUTTON.borderRadius, 0x000000, 0, 6,
            )
            this.shadow.texture = texture
            this.shadow.anchor.set(0.5)
            this.addChild(this.shadow)
        }
        
        this.image = new Sprite(texture)
        this.image.anchor.set(0.5)
        this.addChild(this.image)

        this.isActive = isActive
        this.setActive(this.isActive)
    }

    setActive(isActive = true) {
        this.isActive = isActive
        if (this.isActive) {
            this.alpha = 1
            this.activate()
        } else {
            this.alpha = 0.5
            this.deactivate()
        }
    }

    setLabel(label) {
        this.label.text = label
    }

    setTexture(texture) {
        this.image.texture = texture
    }

    click() {
        if (!this.isActive) return

        playSound(sounds.se_click)
        this.callback()
    }

    onHover() {
        if (!this.isActive) return

        /* playSound(sounds.se_swipe) */
    }
    onOut() {
        /*this.label.style = styles.button*/
    }

    activate() {
        setCursorPointer(this.image)
        this.image.on('pointerdown', this.click, this)
        this.image.on('pointerover', this.onHover, this)
        this.image.on('pointerout', this.onOut, this)
    }

    deactivate() {
        removeCursorPointer(this.image)
        this.image.off('pointerdown', this.click, this)
        this.image.off('pointerover', this.onHover, this)
        this.image.off('pointerout', this.onOut, this)
    }

    kill() {
        removeCursorPointer(this.image)
        this.deactivate()
    }
}