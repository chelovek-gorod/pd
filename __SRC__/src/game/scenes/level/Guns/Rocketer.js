import { AnimatedSprite } from "pixi.js";
import { tickerAdd } from "../../../../app/application";
import { atlases } from "../../../../app/assets";

const DATA = {
    attackRadius: [200, 240, 300, 400],
    attackTimeout: [2400, 2000, 1600, 1200],
    shuts: [2, 3, 4],
    shutTimeout: 200,
}

const FRAMES = 24
const _2PI = Math.PI * 2
const TURN_A = _2PI / FRAMES
const FRAME_ANGLES = []
for (let i = 0; i < FRAMES; i++) FRAME_ANGLES.push((i * TURN_A) % _2PI)

let level = 3
function getLevel() {
    level++
    if (level > 3) level = 1
    return level
}

export default class Rocketer extends AnimatedSprite {
    constructor(enemies) {
        super(atlases.gun_rocketer.animations[getLevel()])
        this.anchor.set(0.5)
        this.currentFrame = 0

        this.direction = 0
        this.targetAngle = 0

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
        const dx = this.targetEnemy.x - this.parent.x
        const dy = this.targetEnemy.y - this.parent.y

        const angle = Math.atan2(dy, dx)
        const normalized = (angle + _2PI) % _2PI

        const targetFrame = Math.round(normalized / TURN_A) % FRAMES

        if (targetFrame === this.currentFrame) return true

        const diff = (targetFrame - this.currentFrame + FRAMES) % FRAMES
        const direction = diff > FRAMES / 2 ? -1 : 1

        const frameIndex = (this.currentFrame + direction + FRAMES) % FRAMES
        this.gotoAndStop(frameIndex)

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