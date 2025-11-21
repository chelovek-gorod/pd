import { Container, Text, Graphics } from "pixi.js";
import { EventHub, events } from "../../app/events";
import { styles } from "../../app/styles";
import { POPUP, POPUP_TEXT, LOGS, SECTOR, SECTOR_NUMBERS } from "../constants";
import { isLangRu, results } from "../state";

const SIZE_TYPE = {
    last : 'last',
    previous : 'previous',
    rests : 'rests'
}

const titleY = -208
const hrY = -176
const hrX = 240

function setNumberInText(number, numberText) {
    numberText.text = number
    if (number === '') return

    if (SECTOR_NUMBERS[SECTOR.black].includes(+number)) {
        numberText.style = numberText.sizeType === SIZE_TYPE.rests
            ? styles.logRestsBlack
            : numberText.sizeType === SIZE_TYPE.previous
            ? styles.logPreviousBlack
            : styles.logLastBlack
    } else if (SECTOR_NUMBERS[SECTOR.red].includes(+number)) {
        numberText.style = numberText.sizeType === SIZE_TYPE.rests
            ? styles.logRestsRed
            : numberText.sizeType === SIZE_TYPE.previous
            ? styles.logPreviousRed
            : styles.logLastRed
    } else {
        numberText.style = numberText.sizeType === SIZE_TYPE.rests
            ? styles.logRestsWhite
            : numberText.sizeType === SIZE_TYPE.previous
            ? styles.logPreviousWhite
            : styles.logLastWhite
    }
}

export default class Logs extends Container {
    constructor() {
        super()

        // title
        this.title = new Text({text: isLangRu ? POPUP_TEXT.logs.ru : POPUP_TEXT.logs.en, style: styles.popupTitle})
        this.title.anchor.set(0.5)
        this.title.position.set(0, titleY)
        this.addChild(this.title)
        // hr
        this.hr = new Graphics()
        this.hr.moveTo(-hrX, hrY)
        this.hr.lineTo( hrX, hrY)
        this.hr.stroke({width: 4, color: 0xffffff})
        this.addChild(this.hr)

        // logs
        this.logs = new Container()
        this.addChild(this.logs)
        this.createLogs()

        EventHub.on(events.addLog, this.addLog, this)
    }

    createLogs() {
        let index = 0
        let y = LOGS.y
        for(let line = 0; line < LOGS.lines; line++) {
            let x = LOGS.x
            for(let ceil = 0; ceil < LOGS.piecesInRow; ceil++) {
                const number = index < results.length ? results[index] : ''
                const numberText = new Text()
                numberText.sizeType = index > 1
                    ? SIZE_TYPE.rests : index === 1
                    ? SIZE_TYPE.previous : SIZE_TYPE.last
                setNumberInText(number, numberText)
                numberText.anchor.set(0.5)
                numberText.position.set(x, y)
                this.logs.addChild(numberText)
                x += LOGS.stepX
                index++
            }
            y += LOGS.stepY
        }

    }

    addLog(number) {
        let i = this.logs.children.length - 1
        while(i > 0) {
            if (this.logs.children[i - 1].text !== '') {
                setNumberInText(this.logs.children[i - 1].text, this.logs.children[i])
            }
            i--
        }
        setNumberInText(number, this.logs.children[0])
    }

    kill() {
        EventHub.off(events.addLog, this.addLog, this)

        while(this.logs.children.length) this.logs.children[0].destroy()

        while(this.children.length) {
            tickerRemove(this.children[0])
            if ('kill' in this.children[0]) this.children[0].kill()
            else this.children[0].destroy()
        }
        this.destroy()
    }
}