import { AnimatedSprite, Container, Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../../app/application";
import { atlases, images } from "../../../../app/assets";
import { EventHub, events, hideGunMenu, launchVehicle, showGunMenu } from "../../../../app/events";
import { setCursorPointer } from "../../../../utils/functions";
import { GUN_TYPE } from "../constants"
import Rocketer from "./Rocketer";

export default class Base extends Container {
    constructor(orbit, count, index) {
        super()

        this.orbit = orbit
        this.orbitPath = orbit.path
        this.orbitPathSize = orbit.pathSize

        // highlight
        this.isHighlight = false

        this.highlight_1 = new Sprite(atlases.guns.textures.base_highlight)
        this.highlight_1.anchor.set(0.5)
        this.highlight_1.alpha = 0

        this.highlight_2 = new Sprite(atlases.guns.textures.base_highlight)
        this.highlight_2.anchor.set(0.5)
        this.highlight_2.alpha = 0

        this.highlight_3 = new Sprite(atlases.guns.textures.base_highlight)
        this.highlight_3.anchor.set(0.5)
        this.highlight_3.alpha = 0

        this.highlight = [
            {alpha: 0.66, image: this.highlight_1},
            {alpha: 0.33, image: this.highlight_2},
            {alpha: 0, image: this.highlight_3}
        ]

        this.isSelected = false

        // base
        // this.base = new Sprite(atlases.guns.textures.base)
        this.base = new AnimatedSprite(atlases.gun_base.animations.open)
        this.base.anchor.set(0.5)
        this.base.animationSpeed = 0.5
        this.base.loop = false
        this.addChild(this.base)

        this.isWaitGun = false
        this.lightState = 0

        this.light_a = new Sprite(atlases.guns.textures.base_light_a)
        this.light_a.anchor.set(0.5)
        this.light_a.alpha = 0

        this.light_b = new Sprite(atlases.guns.textures.base_light_b)
        this.light_b.anchor.set(0.5)
        this.light_b.alpha = 0

        // gun
        this.gunType = GUN_TYPE.NONE
        this.gun = null // new Sprite()
        /*
        this.gun.anchor.set(0.5)
        this.addChild(this.gun)
        */

        this.rangeIndex = 0

        this.range = new Sprite()
        this.range.anchor.set(0.5)
        this.addChild(this.range)

        this.speed = orbit.speed
        this.pathFraction = 0
        this.orbitIndex = Math.floor(orbit.pathSize / count * index)
        const pathIndex = this.orbitIndex * 4
        this.position.set(this.orbitPath[pathIndex], this.orbitPath[pathIndex + 1])
        this.scale.set(this.orbitPath[pathIndex + 2])

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
        this.addChild(this.light_a, this.light_b)
        this.isWaitGun = true
        this.lightState = 0
    }

    addGun() {
        if (this.gunType === GUN_TYPE.NONE) return

        switch(this.gunType) {
            case GUN_TYPE.PRISMA:
                this.gun.texture = atlases.guns.textures["gun-prisma"]
                this.gun.anchor.set(0.5)
            break
            case GUN_TYPE.RADAR:
                this.gun.texture = atlases.guns.textures["gun-radar"]
                this.gun.anchor.set(0.5)
            break
            case GUN_TYPE.ROCKETER:
                /*
                this.gun.texture = atlases.guns.textures["gun-rocketer"]
                this.gun.anchor.set(0.5)
                */
                this.gun = new Rocketer([this.parent.parent.target])
                this.addChild(this.gun)
            break
            case GUN_TYPE.SPARKS:
                this.gun.texture = atlases.guns.textures["gun-sparks"]
                this.gun.anchor.set(0.5)
            break
            case GUN_TYPE.TESLA:
                this.gun.texture = atlases.guns.textures["gun-tesla"]
                this.gun.anchor.set(0.5)
            break
        }

        this.removeChild(this.light_a, this.light_b)
        this.isWaitGun = false
        this.lightState = 0
        this.light_a.alpha = 0
        this.light_b.alpha = 0
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

    updateLights(deltaMS) {
        const step = deltaMS * 0.003

        switch(this.lightState) {
            case 0:
                this.light_a.alpha += step
                if (this.light_a.alpha > 0.7) this.lightState++
            break
            case 1:
                this.light_a.alpha -= step
                if (this.light_a.alpha < 0) this.lightState++
            break
            case 2:
                this.light_b.alpha += step
                if (this.light_b.alpha > 0.7) this.lightState++
            break
            case 3:
                this.light_b.alpha -= step
                if (this.light_b.alpha < 0) this.lightState = 0
            break
        }
    }
  
    tick(time) { return
        const movement = this.speed * time.deltaMS + this.pathFraction
        const path = Math.floor(movement)
        this.pathFraction = movement - path
        
        this.orbitIndex = (this.orbitIndex + path) % this.orbitPathSize
        const pathIndex = this.orbitIndex * 4
        this.position.set(this.orbitPath[pathIndex], this.orbitPath[pathIndex + 1])
        this.scale.set(this.orbitPath[pathIndex + 2])

        if (this.isHighlight) this.updateHighlight(time.deltaMS)
        if (this.isWaitGun) this.updateLights(time.deltaMS)
    }

    kill() {
        this.off('pointerdown', this.getClick, this)
        EventHub.off( events.hideGunMenu, this.resetSelect, this )
        EventHub.off( events.setGun, this.setGunType, this )

        tickerRemove(this)
        this.light_a.destroy({children: true})
        this.light_b.destroy({children: true})
        this.highlight_1.destroy({children: true})
        this.highlight_2.destroy({children: true})
        this.highlight_3.destroy({children: true})
    }
}