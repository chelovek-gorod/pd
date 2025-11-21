import { TextStyle, FillGradient } from "pixi.js"
import { fonts } from "./assets"

const fillButtonGradient = new FillGradient({
    type: 'linear',
    colorStops: [
      { offset: 0, color: '#ffffff' },
      { offset: 1, color: '#f8fe5e' },
    ],
});

export let styles = {
    isReady: false, /* if true -> fonts is already loaded */

    /* Font keys (init all fonts in function bellow) */
    loading: null,
    button: null,
}

export function initFontStyles() {
    styles.loading = new TextStyle({
        fontFamily: fonts.Rubik300,
        fontSize: 48,
        fill: '#ffffff',
    
        dropShadow: true,
        dropShadowColor: '#00ff00',
        dropShadowBlur: 4,
        dropShadowAngle: 0,
        dropShadowDistance: 0,
    })

    styles.button = new TextStyle({
        fontFamily: fonts.Rubik700,
        fontSize: 40,
        fill: fillButtonGradient,

        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowAngle: 0,
        dropShadowDistance: 0,
    })

    styles.isReady = true

    // EXAMPLES
    /*
    gradientText: new TextStyle({
        fontFamily: fonts.RobotoBlack,
        fontSize: 32,
        fill: ['#000000', '#ff0064', '#000000'],

        dropShadow: true,
        dropShadowColor: '#ffffff',
        dropShadowBlur: 6,
        dropShadowAngle: 0,
        dropShadowDistance: 0,

        wordWrap: true,
        wordWrapWidth: 400,
    }),

    textWithShadow: new TextStyle({
        fontFamily: fonts.RobotoBlack,
        fontSize: 18,
        fontStyle: 'normal',
        fontWeight: 'normal',
        fill: ['#ff0000', '#ffff00'],
        
        stroke: '#ffffff',
        strokeThickness: 2,

        dropShadow: true,
        dropShadowColor: '#ff00ff',
        dropShadowBlur: 3,
        dropShadowDistance: 4,
        
        wordWrap: true,
        wordWrapWidth: 440,
        lineJoin: 'round',
    }),
    */
}