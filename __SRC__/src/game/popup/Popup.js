import { Container, Graphics } from "pixi.js"
import { EventHub, events } from "../../app/events"
import { BUTTON_TEXT, POPUP, POPUP_TYPE } from "../constants"
import { isLangRu } from "../state"
import Button from "../UI/Button"
import Bet from "./Bet"
import Logs from "./Logs"

export default class Popup extends Container {
    constructor() {
        super()

        this.shell = new Graphics()
        this.shell.eventMode = 'static'

        this.box = new Container()

        this.bg = new Graphics()
        this.bg.roundRect(POPUP.x, POPUP.y, POPUP.width, POPUP.height, POPUP.borderRadius)
        this.bg.fill(POPUP.bg)
        this.bg.stroke({width: POPUP.borderWidth, color: POPUP.borderColor})
        
        this.closeButton = new Button(
            isLangRu ? BUTTON_TEXT.done.ru : BUTTON_TEXT.done.en,
            POPUP.closeButton.x, POPUP.closeButton.y, this.close.bind(this)
        )
        this.closeButton.scale.set(POPUP.closeButton.scale)

        this.box.addChild(this.bg, this.closeButton)

        this.type = POPUP_TYPE.EMPTY
        this[POPUP_TYPE.bet] = new Bet()
        this[POPUP_TYPE.logs] = new Logs()

        EventHub.on(events.showPopup, this.show, this)
    }

    screenResize(screenData) {
        this.shell.clear()
        this.shell.rect(-screenData.centerX, -screenData.centerY, screenData.width, screenData.height)
        this.shell.fill(POPUP.sellColor)
        this.shell.alpha = POPUP.sellAlpha

        const screenSize = screenData.isLandscape ? screenData.height : screenData.width
        const scale = Math.min(1, screenSize / POPUP.size)
        this.box.scale.set(scale)
    }

    show(type) {
        this.addChild(this.shell, this.box)
        if (type && type in this) {
            this.box.addChild(this[type])
            this.type = type
        }
    }

    close() {
        this.closeButton.onOut()
        if (this.type) {
            this.box.removeChild(this[this.type])
            this.type = POPUP_TYPE.EMPTY
        }
        this.removeChildren()
    }

    kill() {
        EventHub.off(events.showPopup, this.show, this)

        while(this.children.length) {
            tickerRemove(this.children[0])
            if ('kill' in this.children[0]) this.children[0].kill()
            else this.children[0].destroy()
        }
        this.destroy()
    }
}