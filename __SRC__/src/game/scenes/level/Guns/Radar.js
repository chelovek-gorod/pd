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

export default class Radar extends AnimatedSprite {
    constructor(enemies) {
        super(atlases.gun_radar.animations[getLevel()])
        this.anchor.set(0.5)
        this.animationSpeed = 0.5
        this.play()

        this.experiencePoints = 0
        this.experienceRange = 0
        this.level = 0

        this.shuts = DATA.shuts[this.level]
        this.shutTimeout = DATA.shutTimeout

        this.attackRadius = DATA.attackRadius[this.experienceRange]
        this.attackTimeout = DATA.attackTimeout[this.experienceRange]

        tickerAdd(this)
    }

    tick(time) {
        if (this.attackTimeout > 0) this.attackTimeout -= time.deltaMS
        if (this.shutTimeout > 0) this.shutTimeout -= time.deltaMS
    }
}