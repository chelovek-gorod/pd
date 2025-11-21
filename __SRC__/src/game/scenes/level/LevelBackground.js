import { TilingSprite } from "pixi.js"
import { tickerAdd } from "../../../app/application"

export default class LevelBackground extends TilingSprite {
    constructor(texture, speed_x, speed_y) {
        super(texture)
        
        this.speed_x = speed_x
        this.speed_y = speed_y

        this.bgTileWidth = texture.width
        this.bgTileHeight = texture.height
        this.anchor.set(0.5)

        tickerAdd(this)
    }

    screenResize(screenData) {
        this.width = screenData.width
        this.height = screenData.height
    }

    tick(time) {
        this.tilePosition.x = (this.tilePosition.x + this.speed_x * time.deltaMS) % this.bgTileWidth
        this.tilePosition.y = (this.tilePosition.y + this.speed_y * time.deltaMS) % this.bgTileHeight
    }
}