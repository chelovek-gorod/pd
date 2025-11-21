import { Container } from 'pixi.js'
import { kill, tickerRemove } from '../../../app/application'
import { images, music } from '../../../app/assets'
import { setMusic } from '../../../app/sound'
import Button from '../../UI/Button'
import BackgroundGradient from '../../BG/BackgroundGradient'
import { startScene } from '../../../app/events'
import { SCENE_NAME } from '../constants'

export default class Menu extends Container {
    constructor() {
        super()
        this.alpha = 0

        this.bg = new BackgroundGradient(["#770077", "#000000"])
        this.addChild(this.bg)

        this.startButton = new Button(images.button, 'start', this.start.bind(this), true, null)
        this.startButton.position.set(0, 0)
        this.addChild(this.startButton)

        setMusic([music.bgm_menu])
    }

    screenResize(screenData) {
        // set scene container in center of screen
        this.position.set( screenData.centerX, screenData.centerY )

        this.bg.screenResize(screenData)
    }

    start() {
        startScene(SCENE_NAME.Level)
    }

    kill() {
        tickerRemove(this)
    }
}