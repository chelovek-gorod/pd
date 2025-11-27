import { Sprite, Container } from "pixi.js";
import { tickerAdd } from "../../../../app/application";
import { atlases } from "../../../../app/assets";

const DATA = {
    attackRadius: [200, 240, 300, 400],
    attackTimeout: [2400, 2000, 1600, 1200],
    shuts: [2, 3, 4],
    shutTimeout: 200,
}

let level = 3
function getLevel() {
    level++
    if (level > 3) level = 1
    return level
}

export default class Prism extends Container {
    constructor(enemies) {
        super()

        this.base = new Sprite(atlases.gun_prism.textures["base_" + getLevel()])
        this.base.anchor.set(0.5)
        this.addChild(this.base)

        this.light = new Sprite(atlases.gun_prism.textures["top_" + getLevel()])
        this.light.anchor.set(0.5)
        this.light.alpha = 0
        this.addChild(this.light)

        this.targetEnemy = null
        this.enemies = enemies
        this.isTimeToFindNearest = false

        this.experiencePoints = 0
        this.experienceRange = 0
        this.level = 0

        this.shuts = DATA.shuts[this.level]
        this.shutTimeout = DATA.shutTimeout

        this.attackRadius = DATA.attackRadius[this.experienceRange]
        this.attackTimeout = DATA.attackTimeout[this.experienceRange]

        this.isActionFrame = true
        this.previousDeltaMS = 0

        tickerAdd(this)
    }

    searchTarget() {
        let distance = Infinity

        for (let i = 0; i < this.enemies.length; i++) {
            let dx = this.enemies[i].x - this.x
            let dy = this.enemies[i].y - this.y
            const distSq = dx * dx + dy * dy
            if (distSq < distance) {
                distance = distSq
                this.targetEnemy = this.enemies[i]
            }
        }
    }

    followTarget() {

        return false
    }

    tick(time) {
        this.isActionFrame = !this.isActionFrame

        if (this.isActionFrame) {
            this.previousDeltaMS = time.deltaMS

            if (this.targetEnemy) this.followTarget()
            else this.searchTarget()
        } else {
            if (this.attackTimeout > 0) this.attackTimeout -= time.deltaMS
            if (this.shutTimeout > 0) this.shutTimeout -= time.deltaMS
        }
    }
}