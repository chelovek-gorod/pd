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
        this.optimalAssignment = []

        // Создаем стартовые мины сразу в правильных позициях
        if (startMinesCount > 0) {
            this.createInitialMines(startMinesCount)
            tickerAdd(this)
        }

        EventHub.on(events.setMine, this.addMine, this)
    }

    createInitialMines(count) {
        const step = this.orbitPathSize / count
        
        for (let i = 0; i < count; i++) {
            const orbitIndex = Math.floor(i * step)
            const newMine = new Mine(orbitIndex, this.removeMine.bind(this))
            this.mines.push(newMine)
            this.shellsContainer.addChild(newMine)
        }
        
        this.redistributePositions()
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
        const hadMinesBefore = this.mines.length > 0

        for(let i = 0; i < 3; i++) {
            const currentOrbitIndex = (orbitIndex + i * 5) % this.orbitPathSize
            const newMine = new Mine(currentOrbitIndex, this.removeMine.bind(this))
            this.mines.push(newMine)
            this.shellsContainer.addChild(newMine)
        }
        
        // Если мин не было до прибытия - запускаем тикер
        if (!hadMinesBefore) {
            tickerAdd(this)
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
            this.optimalAssignment = []
            tickerRemove(this) // Останавливаем тикер когда мин нет
            return
        }

        const step = this.orbitPathSize / this.mines.length
        this.basePointIndexes = []
        
        // Определяем точку отсчета
        let startIndex
        if (this.mines.length === 1) {
            startIndex = this.mines[0].orbitIndex // Первая/единственная мина
        } else {
            startIndex = this.mines[this.mines.length - 1].orbitIndex // Последняя прибывшая мина
        }
        
        // Создаем целевые позиции относительно точки отсчета
        for (let i = 0; i < this.mines.length; i++) {
            const targetIndex = (startIndex + Math.floor(i * step)) % this.orbitPathSize
            this.basePointIndexes.push(targetIndex)
        }
        
        this.optimalAssignment = this.findOptimalAssignment()
    }
    
    findOptimalAssignment() {
        const assignment = []
        const usedTargets = new Set()
        
        for (const mine of this.mines) {
            let bestTarget = null
            let bestDistance = Infinity
            
            for (const target of this.basePointIndexes) {
                if (usedTargets.has(target)) continue
                
                const dist = this.circularDistance(mine.orbitIndex, target)
                if (dist < bestDistance) {
                    bestDistance = dist
                    bestTarget = target
                }
            }
            
            if (bestTarget !== null) {
                assignment.push({ mine, target: bestTarget })
                usedTargets.add(bestTarget)
            }
        }
        
        return assignment
    }
    
    circularDistance(a, b) {
        const direct = Math.abs(a - b)
        const wrap = this.orbitPathSize - direct
        return Math.min(direct, wrap)
    }
    
    assignTargets() {
        if (!this.optimalAssignment || this.currentAssignIndex >= this.optimalAssignment.length) {
            this.currentAssignIndex = 0
            return
        }
        
        const pair = this.optimalAssignment[this.currentAssignIndex]
        const targetOffset = (pair.target + this.orbitOffset) % this.orbitPathSize
        pair.mine.updateTarget(targetOffset)
        this.currentAssignIndex++
    }

    tick(time) {
        this.orbitOffset = (this.orbitOffset + this.orbitSpeed * time.deltaMS) % this.orbitPathSize
        if (this.currentAssignIndex < this.optimalAssignment.length) {
            this.assignTargets()
        }
    }

    kill() {
        tickerRemove(this)
        EventHub.off(events.setMine, this.addMine, this)
        
        this.mines.forEach(mine => kill(mine))
        this.mines = []
        this.basePointIndexes = []
        this.currentAssignIndex = 0
        this.optimalAssignment = []
    }
}