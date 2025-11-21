export const assetType = {
    images : 'images',
    atlases: 'atlases',
    sounds : 'sounds',
    music : 'music',
    voices : 'voices',
    fonts : 'fonts',
}

export const path = {
    images : './images/',
    atlases: './atlases/',
    sounds : './sounds/',
    music : './music/',
    voices : './voices/',
    fonts : './fonts/',
}
export const fonts = {
    Rubik900: 'Rubik-Black.ttf',
    Rubik300: 'Rubik-Light.ttf',
    Rubik400: 'Rubik-Regular.ttf',
    Rubik500: 'Rubik-Medium.ttf',
    Rubik700: 'Rubik-Bold.ttf',
}

export const images = {
    button: 'button.png',
    finger: 'finger.png',
    logo: 'logo.png',

    space_bg: 'space_bg_tile.jpg',
    earth_smoke: 'earth_smoke.png',

    gun_highlight: 'gun_highlight.png',
    rocket: 'rocket.png',

    button_add: 'short_button_add.png',
    button_sub: 'short_button_sub.png',

    button_gun_close: 'UI_BUTTON_gun_close.png',
    button_gun_sparks: 'UI_BUTTON_gun_sparks.png',
    button_gun_radar: 'UI_BUTTON_gun_radar.png',
    button_gun_rocketer: 'UI_BUTTON_gun_rocketer.png',
    button_gun_tesla: 'UI_BUTTON_gun_tesla.png',
    button_gun_prisma: 'UI_BUTTON_gun_prisma.png',

    sun_red: 'sun_red_580x580px.png',
    dp_filter: 'dpf_4.png', // 1, 4, 
}
export const atlases = {
    earth: 'earth_0.json',

    launch_vehicle: 'launch-vehicle.json',
    fire: 'fire.json',

    asteroid: 'asteroid.json',
    asteroid_rock: 'asteroid_rock.json',

    gun_range: 'gun_range.json',
    gun_mine: 'gun_mine.json',
    gun_base: 'gun_base.json',
    gun_gatling: 'gun_gatling.json',
    gun_rocketer: 'gun_rocketer.json',
    gun_radar: 'gun_radar.json',
    gun_tesla: 'gun_tesla.json',
    gun_prism: 'gun_prism.json',
}
export const sounds = {
    se_click: 'se_click.mp3',
}
export const voices = {
    // voice_start_1: 'voice_ru_start_first.mp3',
    // voice_start_2: 'voice_ru_start_second.mp3',
}
export const music = {
    bgm_0: 'bgm_0.mp3',
    bgm_1: 'bgm_1.mp3',
    bgm_2: 'bgm_2.mp3',
    bgm_3: 'bgm_3.mp3',
    bgm_4: 'bgm_4.mp3',
    bgm_5: 'bgm_5.mp3',
    bgm_6: 'bgm_6.mp3',
    bgm_lose: 'bgm_lose.mp3',
    bgm_menu: 'bgm_menu.mp3',
    bgm_win: 'bgm_win.mp3',
}

// group for loader
export const assets = {fonts, images, atlases, sounds, voices, music}
for (let assetType in assets) {
    for (let key in assets[assetType]) {
        assets[assetType][key] = path[assetType] + assets[assetType][key]
    }
}

// check duplicated keys
const allKeys = new Map()
const duplicates = new Set()

for (const [assetTypeName, assetCollection] of Object.entries(assets)) {
    for (const key of Object.keys(assetCollection)) {
        if (allKeys.has(key)) duplicates.add(key)
        allKeys.set(key, assetTypeName)
    }
}

if (duplicates.size > 0) {
    const duplicateDetails = Array.from(duplicates).map(key => {
        const types = []
        for (const [typeName, assetCollection] of Object.entries(assets)) {
            if (Object.prototype.hasOwnProperty.call(assetCollection, key)) {
                types.push(typeName)
            }
        }
        return `"${key}" (${types.join(', ')})`
    }).join(', ')
    
    throw new Error(`Duplicate asset keys detected: ${duplicateDetails}`)
}