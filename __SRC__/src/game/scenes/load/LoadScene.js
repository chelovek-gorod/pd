import { Container, Text, Sprite, Graphics } from 'pixi.js'
import { assetType, assets, sounds } from '../../../app/assets'
import { styles } from '../../../app/styles'
import { getAppScreen, tickerAdd, tickerRemove } from '../../../app/application'
import { ALPHA_STEP, PROGRESS_TEXT, PROGRESS_BAR, DONE_TEXT } from './constants'
import { loadAssets, preloadAsset, preloadFonts } from '../../../utils/loader'
import { removeCursorPointer, setCursorPointer } from '../../../utils/functions'
import { startScene } from '../../../app/events'
import { SCENE_NAME } from '../constants'
import { isLangRu } from '../../state'
import { getFirstUserAction, playSound } from '../../../app/sound'
import BackgroundGradient from '../../BG/BackgroundGradient'

let isFirstLoading = true

export default class LoadScene extends Container {
    constructor() {
        super()

        this.bg = new BackgroundGradient(["#cc0000", "#000000"])
        this.addChild(this.bg)

        this.progressBar = new Graphics()
        this.drawProgress(0)
        this.addChild(this.progressBar)

        this.progressText = null
        this.doneText = null
        this.logo = null

        this.isLoadingDone = false

        if (isFirstLoading) preloadFonts(this.setText.bind(this))
        else this.setText()

        tickerAdd(this)
    }

    setText() {
        if (!this.progressText) {
            this.progressText = new Text({ text:'0%', style: styles.loading })
            this.progressText.anchor.set(PROGRESS_TEXT.anchor)
            this.progressText.position.y = PROGRESS_TEXT.y
            this.addChild(this.progressText)
        }
        this.preloadLogo()
    }

    preloadLogo() {
        if (!this.logo) {
            preloadAsset(assetType.images, 'img_logo', this.setLogo.bind(this))
        }
    }

    setLogo() {
        this.logo = new Sprite(assets.images.img_logo)
        this.logo.scale.set(0.25)
        this.logo.anchor.set(1)
        const screenData = getAppScreen()
        this.logo.position.set(screenData.centerX - 12, screenData.centerY - 12)
        this.addChild(this.logo)

        this.startLoading()
    }

    startLoading() {
        const loadingData = {
            [assetType.images]: Object.keys(assets.images),
            [assetType.atlases]: Object.keys(assets.atlases),
            [assetType.sounds]: Object.keys(assets.sounds),
            [assetType.voices]: Object.keys(assets.voices)
        }
        
        loadAssets(loadingData, this.loadingDone.bind(this), this.update.bind(this))
    }

    loadingDone() {
        this.doneText = new Text({
            text: 'click to start',
            style: styles.loading
        })
        this.doneText.alpha = 0
        this.doneText.anchor.set(0.5)
        const screenData = getAppScreen()
        this.resizeDoneText( screenData.width )
        this.addChild(this.doneText)

        this.isLoadingDone = true

        setCursorPointer(this)
        this.on('pointerdown', this.getClick, this)
    }

    resizeDoneText(screenWidth) {
        this.doneText.scale.set(1)
        const scale = Math.min(1, screenWidth / (this.doneText.width + 24))
        this.doneText.scale.set(scale)
    }

    screenResize(screenData) {
        this.position.set(screenData.centerX, screenData.centerY)
        if (this.bg) this.bg.screenResize(screenData)
        if (this.logo) this.logo.position.set(screenData.centerX - 12, screenData.centerY - 12)
        if (this.doneText) this.resizeDoneText(screenData.width)
    }

    update(progress, loadedAssetsCount, assetsCount) {
        const range = Math.round(progress)
        this.drawProgress(range)
        this.progressText.text = range + '%'
    }

    drawProgress(range) {
        this.progressBar.clear()

        this.progressBar.roundRect(
            PROGRESS_BAR.x, PROGRESS_BAR.y,
            PROGRESS_BAR.width, PROGRESS_BAR.height,
            PROGRESS_BAR.borderRadius
        )
        this.progressBar.stroke({width: PROGRESS_BAR.borderLineWidth, color: PROGRESS_BAR.color})

        const width = 2.5 * range
        if (width < PROGRESS_BAR.progressRadius) return
        
        this.progressBar.roundRect(
            PROGRESS_BAR.x + PROGRESS_BAR.progressOffset,
            PROGRESS_BAR.y + PROGRESS_BAR.progressOffset,
            width,
            PROGRESS_BAR.height - PROGRESS_BAR.progressOffset * 2,
            PROGRESS_BAR.progressRadius
        )
        this.progressBar.fill(PROGRESS_BAR.color)
    }

    getClick() {
        if (!this.isLoadingDone) return

        getFirstUserAction()
        playSound(sounds.se_click)

        this.isLoadingDone = false
        startScene(SCENE_NAME.Menu)
        
        removeCursorPointer(this)
        this.off('pointerdown', this.getClick, this)
        document.body.style.cursor = 'auto'
    }

    tick(time) {
        const alphaStep = time.elapsedMS * ALPHA_STEP
        if (this.bg && this.bg.alpha < 1) this.bg.alpha += alphaStep
        if (this.logo && this.logo.alpha < 1) this.logo.alpha += alphaStep
        
        if (this.isLoadingDone) {
            this.progressBar.alpha -= alphaStep
            this.progressText.alpha -= alphaStep
            this.doneText.alpha += alphaStep
            if (this.doneText.alpha >= 1) tickerRemove(this)
        } 
    }

    kill() {
        tickerRemove(this)

        while(this.children.length) {
            if ('kill' in this.children[0]) this.children[0].kill()
            else this.children[0].destroy()
        }

        this.destroy()
    }
}