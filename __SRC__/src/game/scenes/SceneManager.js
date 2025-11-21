import { getAppScreen, kill, sceneAdd, sceneRemove, tickerAdd, tickerRemove } from "../../app/application"
import { EventHub, events } from "../../app/events"
import { SCENE_ALPHA_STEP, SCENE_ALPHA_MIN, SCENE_ALPHA_MAX } from "./constants"

let sceneManager = null

export default class SceneManager {
    constructor() {
        if (sceneManager) return sceneManager

        this.scenesQueue = []
        this.screenData = getAppScreen()

        sceneManager = this

        EventHub.on( events.screenResize, this.screenResize, this)
    }

    screenResize(screenData) {
        this.screenData = screenData
        if (this.scenesQueue.length > 0) this.updateSceneSize()
    }
    
    updateSceneSize() {
        if ('screenResize' in this.scenesQueue[0]) {
            this.scenesQueue[0].screenResize(this.screenData)
        }
    }

    add( scene ) {
        this.scenesQueue.push(scene)
        if (this.scenesQueue.length === 1) {
            this.updateSceneSize()
            this.scenesQueue[0].alpha = SCENE_ALPHA_MIN
            sceneAdd(this.scenesQueue[0])
        }
        tickerAdd(this)
    }

    replaceScenes() {
        sceneRemove(this.scenesQueue[0])
        kill(this.scenesQueue[0])
        this.scenesQueue[0] = this.scenesQueue.pop()
        while(this.scenesQueue.length > 1) kill(this.scenesQueue[1])
        this.updateSceneSize()
        this.scenesQueue[0].alpha = SCENE_ALPHA_MIN
        sceneAdd(this.scenesQueue[0])
    }

    scenesReady() {
        tickerRemove(this)
        this.scenesQueue[0].alpha = SCENE_ALPHA_MAX
    }

    tick(time) {
        if (this.scenesQueue.length > 1) {
            this.scenesQueue[0].alpha -= time.elapsedMS * SCENE_ALPHA_STEP
            if (this.scenesQueue[0].alpha <= SCENE_ALPHA_MIN) this.replaceScenes()
            return
        } else {
            this.scenesQueue[0].alpha += time.elapsedMS * SCENE_ALPHA_STEP
            if (this.scenesQueue[0].alpha >= SCENE_ALPHA_MAX) this.scenesReady()
        }
    }

    kill() {
        EventHub.off( events.screenResize, this.screenResize, this)
        while(this.scenesQueue.length) kill(this.scenesQueue[0])
    }
}