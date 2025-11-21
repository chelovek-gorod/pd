import { Container } from "pixi.js"
import { images } from "../../../../app/assets"
import Button from "./Button"
import { GUN_TYPE } from "../constants"
import { hideGunMenu, setGun } from "../../../../app/events"

export default class GunMenu extends Container {
    constructor() {
        super()

        this.btn_sparks = new Button(images.button_gun_sparks, () => this.addGun(GUN_TYPE.SPARKS), true)
        this.btn_sparks.position.set(-110, -55)
        this.btn_radar = new Button(images.button_gun_radar, () => this.addGun(GUN_TYPE.RADAR), true)
        this.btn_radar.position.set(0, -55)
        this.btn_rocketer = new Button(images.button_gun_rocketer, () => this.addGun(GUN_TYPE.ROCKETER), true)
        this.btn_rocketer.position.set(110, -55)

        this.btn_tesla = new Button(images.button_gun_tesla, () => this.addGun(GUN_TYPE.TESLA), true)
        this.btn_tesla.position.set(-110, 55)
        this.btn_prisma = new Button(images.button_gun_prisma, () => this.addGun(GUN_TYPE.PRISMA), true)
        this.btn_prisma.position.set(0, 55)
        this.btn_close = new Button(images.button_gun_close, () => hideGunMenu(), true)
        this.btn_close.position.set(110, 55)

        this.addChild(
            this.btn_sparks, this.btn_radar, this.btn_rocketer,
            this.btn_tesla, this.btn_prisma, this.btn_close
        )
    }

    addGun(type) {
        setGun(type)
        hideGunMenu()
    }
}