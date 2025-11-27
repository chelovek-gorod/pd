import { AnimatedSprite, Container, Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../../app/application";
import { atlases, images } from "../../../../app/assets";
import { EventHub, events, hideGunMenu, launchVehicle, showGunMenu } from "../../../../app/events";
import { setCursorPointer } from "../../../../utils/functions";
import { GUN_TYPE } from "../constants"
import Gatling from "./Gatling";
import Prism from "./Prism";
import Radar from "./Radar";
import Rocketer from "./Rocketer";
import Tesla from "./Tesla";

export default class Base extends Container {
    constructor(orbit, count, index) {
        super()

        this.orbit = orbit
        this.orbitPath = orbit.path
        this.orbitPathSize = orbit.pathSize

        // highlight
        this.isHighlight = false

        this.highlight_1 = new Sprite(images.gun_highlight)
        this.highlight_1.anchor.set(0.5)
        this.highlight_1.alpha = 0

        this.highlight_2 = new Sprite(images.gun_highlight)
        this.highlight_2.anchor.set(0.5)
        this.highlight_2.alpha = 0

        this.highlight_3 = new Sprite(images.gun_highlight)
        this.highlight_3.anchor.set(0.5)
        this.highlight_3.alpha = 0

        this.highlight = [
            {alpha: 0.66, image: this.highlight_1},
            {alpha: 0.33, image: this.highlight_2},
            {alpha: 0, image: this.highlight_3}
        ]

        this.isSelected = false

        // base
        this.base = new AnimatedSprite(atlases.gun_base.animations.open)
        this.base.anchor.set(0.5)
        this.base.animationSpeed = 0.5
        this.base.loop = false
        this.addChild(this.base)

        this.isWaitGun = false

        // gun
        this.gunType = GUN_TYPE.NONE
        this.gun = null

        this.rangeIndex = 0

        this.range = new Sprite()
        this.range.anchor.set(0.5)
        this.addChild(this.range)

        this.speed = orbit.speed
        this.pathFraction = 0
        this.orbitIndex = Math.floor(orbit.pathSize / count * index)
        this.applyPosition()

        setCursorPointer(this)
        this.on('pointerdown', this.getClick, this)

        EventHub.on( events.hideGunMenu, this.resetSelect, this )
        EventHub.on( events.setGun, this.setGunType, this )

        tickerAdd(this)
    }

    getClick() {
        hideGunMenu()
        if (this.isWaitGun) return

        this.isHighlight = true
        this.addChild(this.highlight_1, this.highlight_2, this.highlight_3)
        this.isSelected = true
        showGunMenu()
    }

    resetSelect() {
        this.isSelected = false
        this.isHighlight = false
        this.removeChild(this.highlight_1, this.highlight_2, this.highlight_3)
    }

    setGunType(gunType) {
        if (!this.isSelected) return

        this.gunType = gunType
        launchVehicle(this)
        this.isWaitGun = true
        this.base.play()
    }

    addGun() {
        if (this.gunType === GUN_TYPE.NONE) return

        switch(this.gunType) {
            case GUN_TYPE.ROCKETER:
                this.gun = new Rocketer([{x: 0, y: 0}])
                this.addChild(this.gun)
            break
            case GUN_TYPE.GATLING:
                this.gun = new Gatling([{x: 0, y: 0}])
                this.addChild(this.gun)
            break
            case GUN_TYPE.RADAR:
                this.gun = new Radar([{x: 0, y: 0}])
                this.addChild(this.gun)
            break
            case GUN_TYPE.TESLA:
                this.gun = new Tesla([{x: 0, y: 0}])
                this.addChild(this.gun)
            break
            case GUN_TYPE.PRISMA:
                this.gun = new Prism([{x: 0, y: 0}])
                this.addChild(this.gun)
            break
        }

        this.isWaitGun = false
    }

    addRange() {
        if (this.rangeIndex === 4) return
        this.rangeIndex++
        this.range.texture = atlases.guns.textures["range_" + this.rangeIndex]
        this.range.anchor.set(0.5)
    }

    updateHighlight(deltaMS) {
        const step = deltaMS * 0.001
        for(let i = 0; i < 3; i++) {
            // {alpha: 0.66, image: this.highlight_1}
            let alpha = this.highlight[i].alpha - step
            if (alpha < 0) alpha += 1
            this.highlight[i].alpha = alpha

            this.highlight[i].image.alpha = alpha
            this.highlight[i].image.scale.set(1.5 - alpha)
        }
    }

    applyPosition() {
        const pathIndex = this.orbitIndex * 4
        this.position.set(this.orbitPath[pathIndex], this.orbitPath[pathIndex + 1])
        this.scale.set(this.orbitPath[pathIndex + 2])
    }
  
    tick(time) {
        const movement = this.speed * time.deltaMS + this.pathFraction
        const path = Math.floor(movement)
        this.pathFraction = movement - path
        
        this.orbitIndex = (this.orbitIndex + path) % this.orbitPathSize
        this.applyPosition()

        if (this.isHighlight) this.updateHighlight(time.deltaMS)
    }

    kill() {
        this.off('pointerdown', this.getClick, this)
        EventHub.off( events.hideGunMenu, this.resetSelect, this )
        EventHub.off( events.setGun, this.setGunType, this )

        tickerRemove(this)
        this.highlight_1.destroy({children: true})
        this.highlight_2.destroy({children: true})
        this.highlight_3.destroy({children: true})
    }
}