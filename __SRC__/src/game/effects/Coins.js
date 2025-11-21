import { AnimatedSprite, Container } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../app/application";
import { atlases, sounds } from "../../app/assets";
import { playSound } from "../../app/sound";
import { getRandom } from "../../utils/functions";

const settings = {
    halfSize: 40,
    addCoinMinDelay: 30,
    addCoinMaxDelay: 90,
    coinScaleSpeedMin: 0.0006,
    coinScaleSpeedMax: 0.0012,
    animationSpeedMin: 0.4,
    animationSpeedMax: 0.7,

    screenWidthScale: 0.8,
    screenHeightScale: 0.6,
}

class Coin extends AnimatedSprite {
    constructor(x, y) {
        super(atlases.coin.animations.coin)
        this.anchor.set(0.5)
        this.setup(x, y)
    }

    setup(x, y) {
        this.scale.set(0)
        this.scaleSpeed = getRandom(settings.coinScaleSpeedMin, settings.coinScaleSpeedMax)
        this.rotation = Math.random() * (Math.PI * 2)
        this.position.set(x, y)
        this.animationSpeed = getRandom(settings.animationSpeedMin, settings.animationSpeedMax)
        this.isScaleUp = true
        this.play()
    }

    checkVisiblePosition(minX, maxX, minY, maxY) {
        if (this.position.x + halfSize < minX || this.position.x - halfSize > maxX
        || this.position.y + halfSize < minY || this.position.y - halfSize > maxY) {
            this.remove()
        }
    }

    updateScale(deltaMS) {
        const scaleSpeed = this.scaleSpeed * deltaMS
        if (this.isScaleUp) {
            this.scale.set( Math.min(1, this.scale.x + scaleSpeed) )
            if (this.scale.x === 1) this.isScaleUp = false
        } else {
            this.scale.set( Math.max(0, this.scale.x - scaleSpeed) )
            if (this.scale.x === 0) this.remove()
        }
    }

    remove() {
        this.stop()
        this.parent.coinsPull.push(this)
        this.parent.removeChild(this)
    }
}

export default class Coins extends Container {
    constructor() {
        super()

        this.nextCoinTimeout = getRandom(settings.addCoinMinDelay, settings.addCoinMinDelay)
        this.maxCoins = 50
        this.counter = 0
        this.minX = -960
        this.minY = -960
        this.maxX = 960
        this.maxY = 960

        this.coinsPull = []
    }

    screenResize(screenData) {
        this.maxCoins = Math.floor( (screenData.width * screenData.height) / 21000 )
        this.minX = -screenData.centerX * settings.screenWidthScale
        this.minY = -screenData.centerY * settings.screenHeightScale
        this.maxX = screenData.centerX * settings.screenWidthScale
        this.maxY = screenData.centerY * settings.screenHeightScale
    }

    start(rate = 1) {
        this.nextCoinTimeout = getRandom(settings.addCoinMinDelay, settings.addCoinMinDelay)
        this.counter = Math.ceil(this.maxCoins * rate)
        this.addCoin()
        tickerAdd(this)
        playSound(sounds.se_coins)
    }

    addCoin() {
        const x = getRandom(this.minX, this.maxX)
        const y = getRandom(this.minY, this.maxY)
        if (this.coinsPull.length > 0) {
            const newCoin = this.coinsPull.pop()
            newCoin.setup(x, y)
            this.addChild(newCoin)
        } else {
            const newCoin = new Coin(x, y)
            this.addChild(newCoin)
        }
    }

    tick(time) {
        this.children.forEach(coin => {coin.updateScale(time.deltaMS)})

        if (this.counter > 0) {
            this.nextCoinTimeout -= time.deltaMS
            if (this.nextCoinTimeout < 0) {
                this.counter--
                this.addCoin()
                this.nextCoinTimeout = getRandom(settings.addCoinMinDelay, settings.addCoinMinDelay)
            }
        } else {
            if (this.children.length === 0) tickerRemove(this)
        }
    }

    kill() {
        tickerRemove(this)
        while(this.children.length) this.children[0].destroy()
        while(this.coinsPull.length) {
            const coin = this.coinsPull.pop()
            coin.destroy()
        }
        this.destroy()
    }
}