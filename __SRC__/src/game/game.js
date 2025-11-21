import { EventHub, events } from "../app/events";
import { SCENE_NAME } from "./scenes/constants";
import SceneManager from "./scenes/SceneManager";
import LoadScene from "./scenes/load/LoadScene";
import MenuScene from "./scenes/menu/MenuScene";
import LevelScene from "./scenes/level/LevelScene";

let sceneManager = null

export function startGame() {
    sceneManager = new SceneManager()
    sceneManager.add( new LoadScene() )

    EventHub.on(events.startScene, (sceneName) => {
        switch (sceneName) {
            case SCENE_NAME.Level : return sceneManager.add( new LevelScene() )
            default : return sceneManager.add( new MenuScene() )
        }
    })
}

