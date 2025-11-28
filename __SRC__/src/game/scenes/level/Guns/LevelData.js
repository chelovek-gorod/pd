import { createEnum } from "../../../../utils/functions"

export const ENEMY_TYPE = createEnum([
    'ASTROID'
])
export const ENEMY_PATH_TYPE = createEnum([
    'MIN_HARD', 'MID_NORMAL', 'MAX_EASY'
])

export const levels = [
    {
        enemies: [
            {
                type: ENEMY_TYPE.ASTROID,
                hp: 50,
                speed: 0.1,
                pathType: ENEMY_PATH_TYPE.MAX_EASY,
                damage: 12
            }
        ]
    }
]