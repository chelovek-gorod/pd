import { Container } from 'pixi.js'
import { images, music } from '../../../app/assets'
import { setMusic } from '../../../app/sound'
import LevelBackground from './LevelBackground'
import Base from './Guns/Base'
import { ORBIT_A, ORBIT_B } from './constants'
import GameContainer from './GameContainer'
import Button from '../../UI/Button'
import LaunchVehicle from './Guns/LaunchVehicle'
import GunMenu from './UI/GunMenu'
import { EventHub, events, setMine } from '../../../app/events'
import MinesController from './MinesController'

export default class Level extends Container {
    constructor() {
        super()
        this.alpha = 0

        this.bg = new LevelBackground(images.space_bg, 0.007, 0.002)
        this.addChild(this.bg)

        this.gameContainerScale = 1
        this.gameContainer = new GameContainer()
        this.addChild(this.gameContainer)

        this.minesController = new MinesController(this.gameContainer.shells)

        const countA = 5
        for(let i = 0; i < countA; i++) this.gameContainer.guns.addChild( new Base(ORBIT_A, countA, i) )
        const countB = 9
        for(let i = 0; i < countB; i++) this.gameContainer.guns.addChild( new Base(ORBIT_B, countB, i) )

        this.btn_add = new Button(images.button_add, '', this.scaleAdd.bind(this))
        this.btn_add.scale.set(0.5)

        this.btn_sub = new Button(images.button_sub, '', this.scaleSub.bind(this))
        this.btn_sub.scale.set(0.5)

        this.addChild(this.btn_add, this.btn_sub)

        this.btn_mine = new Button(images.button_gun_spider, '', this.addMine.bind(this))
        this.btn_mine.scale.set(0.5)

        this.addChild(this.btn_add, this.btn_sub, this.btn_mine)

        this.gunMenu = new GunMenu()
        this.gunMenu.scale.set(0)
        this.addChild(this.gunMenu)

        EventHub.on( events.showGunMenu, this.showGunMenu, this )
        EventHub.on( events.hideGunMenu, this.hideGunMenu, this )
        EventHub.on( events.launchVehicle, this.launchVehicle, this )

        setMusic([
            music.bgm_0, music.bgm_1, music.bgm_2, music.bgm_3, music.bgm_4, music.bgm_5, music.bgm_6
        ])
    }

    screenResize(screenData) {
        // set scene container in center of screen
        this.position.set( screenData.centerX, screenData.centerY )

        // bg
        this.bg.screenResize(screenData)

        // game container
        this.gameContainer.screenResize(screenData)

        // UI
        this.btn_add.position.set(-screenData.centerX + 50, -screenData.centerY + 50)
        this.btn_sub.position.set(-screenData.centerX + 50, -screenData.centerY + 100)
        this.btn_mine.position.set(screenData.centerX - 50, screenData.centerY - 50)
    }

    showGunMenu() {
        this.gunMenu.scale.set(1)
    }
    hideGunMenu() {
        this.gunMenu.scale.set(0)
    }

    scaleAdd() {
        this.gameContainer.zoomIn()
    }

    scaleSub() {
        this.gameContainer.zoomOut()
    }

    addMine() {
        setMine()
    }

    launchVehicle(satellite) {
        this.gameContainer.planet.addChild( new LaunchVehicle(satellite) )
    }

    kill() {
        EventHub.off( events.showGunMenu, this.showGunMenu, this )
        EventHub.off( events.hideGunMenu, this.hideGunMenu, this )
        EventHub.off( events.launchVehicle, this.launchVehicle, this )
        this.minesController.kill()
    }
}