import { EventEmitter } from "pixi.js"

export const EventHub = new EventEmitter()

export const events = {
    screenResize: 'screenResize',
    changeFocus: 'changeFocus',

    startScene: 'startScene',

    showGunMenu: 'showGunMenu',
    hideGunMenu: 'hideGunMenu',
    setGun: 'setGun',
    launchVehicle: 'launchVehicle',
}

export function screenResize( data ) {
    EventHub.emit( events.screenResize, data )
}
export function changeFocus( isOnFocus ) {
    EventHub.emit( events.changeFocus, isOnFocus )
}

export function startScene( sceneName ) {
    EventHub.emit( events.startScene, sceneName )
}

export function showGunMenu() {
    EventHub.emit( events.showGunMenu )
}
export function hideGunMenu() {
    EventHub.emit( events.hideGunMenu )
}
export function launchVehicle( satellite ) {
    EventHub.emit( events.launchVehicle, satellite )
}
export function setGun( type ) {
    EventHub.emit( events.setGun, type )
}