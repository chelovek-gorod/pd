import { BlurFilter, Container, Graphics, RenderTexture, Sprite, Texture } from "pixi.js"
import { getAppRenderer } from "../app/application"

// helper: number (0xff0000) -> '#ff0000'
function colorToCss(color) {
    if (typeof color === "string") return color
    return "#" + color.toString(16).padStart(6, "0")
}

export function createOrbitTexture(radius, lineWidth = 2, color = 0x00ff00, alpha = 1) {
    const renderer = getAppRenderer()
    const scaleFactor = 2
    
    // Просто добавляем запас равный толщине линии
    const extra = lineWidth
    const diameter = (radius + extra) * 2
    const scaledDiameter = diameter * scaleFactor
    const center = scaledDiameter / 2
    const scaledRadius = radius * scaleFactor
    const scaledLineWidth = lineWidth * scaleFactor

    const graphics = new Graphics();
    graphics.arc(center, center, scaledRadius, 0, Math.PI * 2)
    graphics.stroke({ width: scaledLineWidth, color, alpha })

    const renderTexture = RenderTexture.create({
        width: scaledDiameter,
        height: scaledDiameter,
        resolution: renderer.resolution
    })

    renderer.render({
        container: graphics,
        target: renderTexture,
        clear: true
    })

    graphics.destroy()

    return {
        texture: renderTexture,
        scale: 1 / scaleFactor
    }
}
  
/**
 * Создает Texture прямоугольника или радиального градиента (PixiJS v8)
 * fill может быть:
 *  - number / string  → сплошной цвет
 *  - объект { type: 'radial-gradient', stops: [...], x0,y0,radius0,x1,y1,radius1 }
 */
 export function getRecTexture(width, height, fill) {
    const renderer = getAppRenderer()
    const resolution = renderer?.resolution ?? 1

    // --- Градиент через canvas ---
    if (fill && fill.type === "radial-gradient") {
        const canvas = document.createElement("canvas")
        canvas.width = Math.ceil(width * resolution)
        canvas.height = Math.ceil(height * resolution)
        const ctx = canvas.getContext("2d")

        if (resolution !== 1) ctx.scale(resolution, resolution)

        const {
            x0 = width / 2,
            y0 = height / 2,
            radius0 = 0,
            x1 = width / 2,
            y1 = height / 2,
            radius1 = Math.max(width, height) / 2,
            stops = []
        } = fill

        const grad = ctx.createRadialGradient(x0, y0, radius0, x1, y1, radius1)
        for (const stop of stops) {
            grad.addColorStop(
                Math.max(0, Math.min(1, stop.offset)),
                colorToCss(stop.color)
            )
        }

        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)

        // создаем PIXI.Texture из canvas
        const tex = Texture.from(canvas, { resolution })
        return tex
    }

    // --- Обычный цвет ---
    const canvas = document.createElement("canvas")
    canvas.width = Math.ceil(width * resolution)
    canvas.height = Math.ceil(height * resolution)
    const ctx = canvas.getContext("2d")

    if (resolution !== 1) ctx.scale(resolution, resolution)
    ctx.fillStyle = colorToCss(fill || 0x000000)
    ctx.fillRect(0, 0, width, height)

    return Texture.from(canvas, { resolution })
}

export function getRRTexture(width, height, borderRadius, color, alpha = 1) {
    const appRenderer = getAppRenderer()

    const container = new Container()

    const RR = new Graphics()
    RR.roundRect(0, 0, width, height, borderRadius)
    RR.fill(color)
    RR.alpha = alpha
    container.addChild(RR)
  
    const resolution = appRenderer.resolution ?? 1
    const rt = RenderTexture.create({
        width: Math.ceil(width),
        height: Math.ceil(height),
        resolution,
    })
  
    appRenderer.render({
        container: container,
        target: rt
    })

    RR.destroy()
    container.destroy()
  
    return rt
}

export function getRRTextureWithShadow(
    width, height, borderRadius, color, offsetX = 0, offsetY = 0, alpha = 0.5, blur = 8
) {
    const appRenderer = getAppRenderer()

    const padding = blur * 4 + Math.max(Math.abs(offsetX), Math.abs(offsetY))
    const totalW = width + padding * 2
    const totalH = height + padding * 2

    const container = new Container()

    const shadow = new Graphics()
    shadow.roundRect(padding + offsetX, padding + offsetY, width, height, borderRadius)
    shadow.fill(0x000000)
    
    const blurFilter = new BlurFilter({ 
        strength: blur, 
        quality: 4 
    })
    shadow.filters = [blurFilter]
    shadow.alpha = alpha
    container.addChild(shadow)

    const RR = new Graphics()
    RR.roundRect(padding, padding, width, height, borderRadius)
    RR.fill(color)
    container.addChild(RR)

    const rt = RenderTexture.create({
        width: totalW,
        height: totalH,
        resolution: appRenderer.resolution
    })

    appRenderer.render({
        container: container,
        target: rt
    })

    RR.destroy()
    shadow.destroy()
    container.destroy()

    return [rt, padding]
}