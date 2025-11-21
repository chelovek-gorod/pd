import { tickerAdd, tickerRemove } from "../app/application"

export default function setSmoothShow(target) {
    if ('tick' in target) return console.warn(`${target} already haw property "tick"`)
    if (!('alphaStep' in target)) return console.warn(`${target} doesn't haw property "alphaStep"`)

    if ('delay' in target && 'maxAlpha' in target) target.tick = smoothShowToMaxAlphaWithDelay
    else if ('maxAlpha' in target) target.tick = smoothShowToMaxAlpha
    else if ('delay' in target) target.tick = smoothShowWithDelay
    else target.tick = smoothShow

    tickerAdd(target)
}

function removeSmoothShow(target) {
    tickerRemove(target)
    delete target.tick
}

function smoothShow(time) {
    if (this.alpha < 1) return this.alpha += this.alphaStep * time.elapsedMS
    
    this.alpha = 1
    removeSmoothShow(this)
}

function smoothShowToMaxAlpha(time) {
    if (this.alpha < this.maxAlpha) return this.alpha += this.alphaStep * time.elapsedMS
    
    this.alpha = this.maxAlpha
    removeSmoothShow(this)
}

function smoothShowWithDelay(time) {
    if (this.delay > 0) return this.delay -= time.elapsedMS

    if (this.alpha < 1) return this.alpha += this.alphaStep * time.elapsedMS
    
    this.alpha = 1
    removeSmoothShow(this)
}

function smoothShowToMaxAlphaWithDelay(time) {
    if (this.delay > 0) return this.delay -= time.elapsedMS

    if (this.alpha < this.maxAlpha) return this.alpha += this.alphaStep * time.elapsedMS
    
    this.alpha = this.maxAlpha
    removeSmoothShow(this)
}