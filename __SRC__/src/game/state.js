import { EventHub, events} from "../app/events"
import { SCENE_NAME } from "../game/scenes/constants"

export let isLangRu = true

export let currentScene = SCENE_NAME.Load
EventHub.on( events.startScene, (scene) => currentScene = scene )