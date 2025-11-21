import { Sound } from '@pixi/sound'
import { EventHub, events } from './events'

const SETTINGS = {
    sound: {
        isOnByDefault: true, // true
        storageKey: 'soundOn',
    },
    music: {
        isOnByDefault: true, // true
        storageKey: 'musicOn',
    }
}

let bgMusicVolume = 0.5
export function setMusicVolume(value) {
    let newVolumeValue = 0.5
    if (typeof value === 'number' && isFinite(value) && value > 0 && value <= 1) {
        newVolumeValue = value
    }

    bgMusicVolume = newVolumeValue

    if (bgMusicPlayingInstance) bgMusicPlayingInstance.volume = bgMusicVolume
}

let isSoundOn = getStoredValue(SETTINGS.sound)
let isMusicOn = getStoredValue(SETTINGS.music)

function getStoredValue(storageData) {
    const saved = localStorage.getItem(storageData.storageKey)
    if (saved) return !!JSON.parse(saved)
    return storageData.isOnByDefault
}

function setStoredValue(storageData, isOn) {
    localStorage.setItem(storageData.storageKey, !!isOn)
}

let isSoundAvailable = false // is game in focus
export function getFirstUserAction() {
    isSoundAvailable = true
}

EventHub.on( events.changeFocus, changeFocus )
function changeFocus( isOnFocus ) {
    isSoundAvailable = isOnFocus
    if (isOnFocus) playMusic()
    else {
        stopMusic()
        stopVoices()
    }
}

// sound control
export function soundTurnOn() {
    isSoundOn = true
    setStoredValue(SETTINGS.sound, isSoundOn)
}
export function soundTurnOff() {
    isSoundOn = false
    setStoredValue(SETTINGS.sound, isSoundOn)
}
export function soundGetState() {
    return isSoundOn
}

// music control
export function musicTurnOn() {
    isMusicOn = true
    setStoredValue(SETTINGS.music, isMusicOn)
}
export function musicTurnOff() {
    isMusicOn = false
    setStoredValue(SETTINGS.music, isMusicOn)
}
export function musicGetState() {
    return isMusicOn
}

// voices

const voicesSet = new Set()
let voiceInstance = null
export function playVoice( vs ) {
    if (!isSoundOn || !isSoundAvailable) return

    if (voiceInstance) return voicesSet.add(vs)

    voiceInstance = vs.play()
    voiceInstance.on('end', () => {
        voiceInstance = null
        if (voicesSet.size === 0) return
        
        const nextVoice = voicesSet.values().next().value
        voicesSet.delete( nextVoice )
        playVoice( nextVoice )
    })
}
export function stopVoices() {
    if (voiceInstance) voiceInstance.stop()
    voiceInstance = null
    voicesSet.clear()
}

// sounds

export function playSound( se ) {
    if (!isSoundOn || !isSoundAvailable) return
    // se.stop()
    se.play()
}
export function stopSound( se ) {
    se.stop()
}

let bgMusicPlayingInstance = null
let bgMusicAudio = null
let bgMusicList = null
let bgMusicIndex = 0
let bgMusicToken = 0 // use for remove unused music

export function setMusic(music, startIndex = null) {
    if (!music) return
  
    bgMusicList = Array.isArray(music) ? music : (typeof music === 'object' ? Object.values(music) : [music])
    
    if (!bgMusicList.length) return
  
    if (startIndex && startIndex < bgMusicList.length) bgMusicIndex = startIndex
    else bgMusicIndex = Math.floor(Math.random() * bgMusicList.length)

    bgMusicToken++
    loadBgMusic()
}

export function stopMusic() {
    if (!bgMusicAudio) return

    if (bgMusicAudio.isPlaying) bgMusicAudio.pause()
    else bgMusicAudio.stop()
}

export function playMusic() {
    if (!isMusicOn || !bgMusicAudio || !bgMusicList) return

    if (bgMusicAudio.paused) bgMusicAudio.resume()
    else bgMusicAudio.play()
}

function loadBgMusic() {
    const token = bgMusicToken
    
    if (bgMusicAudio) {
        bgMusicAudio.stop()
        bgMusicAudio.destroy()
        bgMusicAudio = null
    }

    Sound.from({
        url: bgMusicList[bgMusicIndex],
        preload: true,
        loaded: function(err, sound) {
            if (token !== bgMusicToken) return sound.destroy()
            bgMusicAudio = sound
            bgMusicPlayingInstance = sound.play({ volume: bgMusicVolume }).on('end', nextBgMusic)
            if (!isSoundAvailable || !isMusicOn) stopMusic()
        }
    })
}

function nextBgMusic() {
    if (!bgMusicList?.length) return
  
    bgMusicIndex = (bgMusicIndex + 1) % bgMusicList.length
    bgMusicToken++
    loadBgMusic()
}