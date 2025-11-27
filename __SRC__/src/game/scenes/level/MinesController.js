import { kill, tickerAdd, tickerRemove } from "../../../app/application"
import { EventHub, events } from "../../../app/events"
import { ORBIT_mines } from "./constants"
import LaunchVehicle from "./Guns/LaunchVehicle"
import Mine from "./Guns/Mine"

export default class MinesController {
    constructor(shellsContainer, startMinesCount = 0) {
        this.shellsContainer = shellsContainer
        this.mines = []
        this.orbitSpeed = ORBIT_mines.speed
        this.orbitPath = ORBIT_mines.path
        this.orbitPathSize = ORBIT_mines.pathSize
        this.orbitOffset = 0
        this.basePointIndexes = []
        this.currentAssignIndex = 0

        for(let i = 0; i < startMinesCount; i++) this.addMine()

        EventHub.on(events.setMine, this.addMine, this)
        tickerAdd(this)
    }

    addMine() {
        const mineData = {
            orbit: ORBIT_mines,
            addGun: this.onMineArrived.bind(this)
        }

        this.shellsContainer.addChild(new LaunchVehicle(mineData, true))
    }

    onMineArrived(x, y) {
        const orbitIndex = this.findNearestOrbitIndex(x, y)

        for(let i = 0; i < 3; i++) {
            const currentOrbitIndex = (orbitIndex + i * 5) % this.orbitPathSize
            const newMine = new Mine(currentOrbitIndex, this.removeMine.bind(this))
            this.mines.push(newMine)
            this.shellsContainer.addChild(newMine)
        }
        
        this.redistributePositions()
    }

    findNearestOrbitIndex(x, y) {
        let nearestIndex = 0
        let minDistance = Infinity
        
        for (let i = 0; i < this.orbitPathSize; i++) {
            const pathIndex = i * 4
            const orbitX = this.orbitPath[pathIndex]
            const orbitY = this.orbitPath[pathIndex + 1]
            
            const dx = orbitX - x
            const dy = orbitY - y
            const distance = dx * dx + dy * dy
            
            if (distance < minDistance) {
                minDistance = distance
                nearestIndex = i
            }
        }
        return nearestIndex
    }

    removeMine(mineToRemove) {
        const index = this.mines.indexOf(mineToRemove)
        if (index === -1) return
        
        this.shellsContainer.removeChild(mineToRemove)
        this.mines.splice(index, 1)
        this.redistributePositions()
    }

    redistributePositions() {
        this.currentAssignIndex = 0
        if (this.mines.length === 0) {
            this.basePointIndexes = []
            return
        }

        const step = this.orbitPathSize / this.mines.length
        this.basePointIndexes = []
        
        for (let i = 0; i < this.mines.length; i++) {
            this.basePointIndexes.push(Math.ceil(i * step))
        }
    }

    assignTargets() {
        const sortedMines = this.mines.slice().sort((a, b) => {
            const posA = (a.orbitIndex + this.orbitOffset) % this.orbitPathSize
            const posB = (b.orbitIndex + this.orbitOffset) % this.orbitPathSize
            return posA - posB
        })

        const sortedTargets = this.basePointIndexes.slice().sort((a, b) => {
            const posA = (a + this.orbitOffset) % this.orbitPathSize
            const posB = (b + this.orbitOffset) % this.orbitPathSize
            return posA - posB
        })

        const mine = sortedMines[this.currentAssignIndex]
        const target = sortedTargets[this.currentAssignIndex]
        const targetOffset = (target + this.orbitOffset) % this.orbitPathSize
        
        mine.updateTarget(targetOffset)
        this.currentAssignIndex++
    }

    tick(time) {
        this.orbitOffset = (this.orbitOffset + this.orbitSpeed * time.deltaMS) % this.orbitPathSize
        if (this.currentAssignIndex < this.mines.length) this.assignTargets()
    }

    kill() {
        tickerRemove(this)
        EventHub.off(events.setMine, this.addMine, this)
        
        this.mines.forEach(mine => kill(mine))
        this.mines = []
        this.basePointIndexes = []
        this.currentAssignIndex = 0
    }
}