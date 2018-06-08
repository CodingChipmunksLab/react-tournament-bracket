import React, { PureComponent } from 'react'
import {
    TreeUI,
    CanvasEl,
    ScrollUI
} from '../../ui'
import _ from 'lodash'
import Round from './round'
import PropTypes from 'prop-types'
import { calcCenter, calcRight, calcLeft } from './calc'
import { _const  } from '../../ui/const'
const option = {
    width: 3,
    color: '#BBB',
    radius: 15,
    regionEl: this.tree,
    roundHeight: 400,
    isHideFirstRound: false
}

const checkRecursive = (array, className, idx) => {
    const item = array[idx]
    if (!item) return false
    if (!item.querySelector(className)) checkRecursive(array, className, idx + 1)
    return array[idx]
}
export class SingleElumination extends PureComponent {

    static = {
        timer: this.timer,
        resizeFunc: window.onresize = () => {
            clearTimeout(this.timer)
            this.timer = setTimeout(() => {
                this.clearCanvas(this.TreeCtx)
                this.drawTree()
            }, 1000)
        }
    }

    state = {
        activeTeam: '',
        hoverTeam: '',
        width: 3,
        color: '#BBB',
        radius: 15,
        regionEl: this.tree,
        treeWidth: 0,
        treeHeight: 0,
        roundHeight: 400,
        isHideFirstRound: false
    }
    componentDidUpdate = ({ hoverClass }) => {
        if (hoverClass !== this.props.hoverClass) {
          this.drawRoad()
        }
      }
    componentDidMount = () => {
        this.renderTree()

    }
    async renderTree() {
        try {
            const make = await this.setRoundHeight()
            make && this.init()
        } catch (error) {
            console.log(error)
        }
    }
    setRoundHeight = () => {
        const h = this.tree.offsetHeight
        this.setState({ roundHeight: h + (h / 4) })
        return true
    }


    // add async
    async init() {
        const makeRun = await (() => (
            //// await to initialize canvas
            this.canvasEl && this.canvasActiveRoad
        ))()
        if (makeRun) {
            const rounds = this.tree.getElementsByClassName('round')
            
            const { isGeneral } = this.props

            //// get sizes of tournament tree
            const h = isGeneral ? this.tree.offsetHeight : this.tree.offsetHeight * 2
            const w = isGeneral ? this.tree.offsetWidth : this.tree.offsetWidth * 2


            const treeOffset = this.canvasEl.getBoundingClientRect().left

            //// Init canvas element sizes
            const Tree = this.canvasEl
            const Road = this.canvasActiveRoad

            //// ser property
            const setPropery = (canvas) => {
                canvas.width = w * 2
                canvas.height = h * 2
                canvas.style.width = `${w}px`
                canvas.style.height = `${h}px`
            }
            setPropery(Tree)
            setPropery(Road)
            /// get canvas context
            this.TreeCtx = Tree.getContext('2d')
            this.RoadCtx = Road.getContext('2d')
            

            //// prepear canvas
            
            this.TreeCtx.clearRect(0, 0, Tree.width, Tree.height)
            this.TreeCtx.scale(2, 2);

            this.RoadCtx.clearRect(0, 0, Road.width, Road.height)
            this.RoadCtx.scale(2, 2);


            //// set def sizes to state TODO: maybe need to remove
            this.setState({ treeWidth: w * 2, treeHeight: h * 2, treeOffset: treeOffset, rounds: rounds })
            this.drawTree()
        }

    }

    async drawTree() {
        const { def, rightAlign, isGeneral } = this.props
        const { rounds, treeOffset } = this.state
        let { primaryColor, lineWeight, radius, lineColor } = def
        const { isHideFirstRound } = this.state


        
        if (!lineColor) lineColor = primaryColor
        const defaultLineColor = `#bdc3c7`
        const defaultLineWeight = 0.5
        for (let i = 0; i < rounds.length; i++) {
            
            let isFirstRound = i === 0
            let thisRound = rounds[i]
            if (!thisRound.querySelector('.game')) continue
            let allEmptyTeamInRound = thisRound.getElementsByClassName('miss')
            let thisGames = thisRound.getElementsByClassName('game')

            let count = 1            
            let nextRound = rounds[i + count]
            if (isFirstRound && (allEmptyTeamInRound.length / 2) === thisGames.length) {
                this.setState({ isHideFirstRound: true })
            }
            
            
            
            if (nextRound && !nextRound.querySelector('.game')) {
                count += 1
                nextRound = rounds[i + count]
            } 
            if (!isGeneral && (i === rounds.length - 1)) {

                const firstTreeRounds = document.querySelector(`.${_const.theme}_tree`).querySelectorAll(`.${_const.theme}_round`)
                nextRound = firstTreeRounds[firstTreeRounds.length - 1]
            }
            if (!nextRound) return
            const nextGames = nextRound.getElementsByClassName('game')

            //// isLinear its this_round.length === next_round.length 
            const isLinear = thisGames.length === nextGames.length


            //// cycle of every game in game
            for (let j = 0; j < thisGames.length; j++) {
                let game = thisGames[j]
                let emptyTeam = game.getElementsByClassName('miss')

                //// winner its winnner in this game
                let winner = game.getElementsByClassName('team-winner')
                //// to its where line going ? to next team if they have winner of to next game 
                const to = isLinear ? nextGames[Math.floor(j)] : nextGames[Math.floor(j / 2)]
                //// color of line if game have winner
                let color = winner.length ? lineColor : defaultLineColor
                //// weight of line  if game have winner
                let weight = lineWeight ? lineWeight : defaultLineWeight
                //// where line be started
                //// if rightAlign line started from right
                let startCalcFunc = rightAlign ? calcLeft : calcRight
                let start = startCalcFunc(winner.length ? winner[0] : game, treeOffset)

                //// if () {}  need to hide game if game not have one or more teams
                if (!game.classList.contains('hide_game')) {
                    //// where line end
                    let endCalcFunc = rightAlign ? calcRight : calcLeft
                    const toNext = isLinear ? false : to.getElementsByClassName('team')[(j + 2) % 2]
                    //// line end on center next game or next team
                    const end = endCalcFunc(toNext ? toNext : to, treeOffset)
                    //// calc radius
                    const radiusAdjust = Math.min(radius, Math.abs(start.y - end.y) / 2)
                    //// call func to draw line
                    this.drawSCurve( this.TreeCtx, start, end, color, weight, radius, radiusAdjust)
                }
            }
        }

    }

    clearCanvas = (canvasCtx) => {
        const { treeHeight, treeWidth } = this.state
        canvasCtx.clearRect(0, 0, treeHeight, treeWidth);
    }

    drawRoad = () => {
        const { def, rightAlign, hoverClass, isGeneral } = this.props
        const { rounds, treeOffset } = this.state
        
        if (hoverClass === '') {
            this.clearCanvas(this.RoadCtx)
            return
        }
        let { primaryColor, lineWeight, radius, lineColor } = def
        const { isHideFirstRound } = this.state
        if (!lineColor) lineColor = primaryColor
        const defaultLineColor = `#bdc3c7`
        const defaultLineWeight = 0.5
        for (let i = 0; i < rounds.length; i++) {
            let isFirstRound = i === 0
            let thisRound = rounds[i]
            if (!thisRound.querySelector('.game')) continue
            let allEmptyTeamInRound = thisRound.getElementsByClassName('miss')
            let thisGames = thisRound.getElementsByClassName('game')
            let nextRound = rounds[i + 1]
            if (isFirstRound && (allEmptyTeamInRound.length / 2) === thisGames.length) {
                this.setState({ isHideFirstRound: true })
            }
            let count = 1         
            
            if (nextRound && !nextRound.querySelector('.game')) {
                count += 1
                nextRound = rounds[i + count]
            } 
            if (!isGeneral && (i === rounds.length - 1)) {

                const firstTreeRounds = document.querySelector(`.${_const.theme}_tree`).querySelectorAll(`${_const.theme}_round`)
                nextRound = firstTreeRounds[firstTreeRounds.length - 1]
            }
            if (!nextRound) return
            const nextGames = nextRound.getElementsByClassName('game')

            //// isLinear its this_round.length === next_round.length 
            const isLinear = thisGames.length === nextGames.length


            //// cycle of every game in game
            for (let j = 0; j < thisGames.length; j++) {
                let game = thisGames[j];
                let emptyTeam = game.getElementsByClassName('miss');

                //// winner its winnner in this game
                let winner = game.getElementsByClassName('team-winner');
                if (winner.length && !winner[0].classList.contains(`${hoverClass}`)) {
                    continue
                };
                //// to its where line going ? to next team if they have winner of to next game 
                const to = isLinear ? nextGames[Math.floor(j)] : nextGames[Math.floor(j / 2)];
                //// color of line if game have winner
                let color;
                //// weight of line  if game have winner
                let weight = lineWeight ? lineWeight : defaultLineWeight;
                //// where line be started
                //// if rightAlign line started from right
                let startCalcFunc = rightAlign ? calcLeft : calcRight;
                let start = startCalcFunc(winner.length ? winner[0] : game, treeOffset);


                let startSelector = winner.length ? winner[0] : game;
                
                (() => {
                    // if (isFirstRound &&  emptyTeam.length) {
                    //     return;
                    // } else {
                        
                        if (startSelector.classList.contains(`${this.props.hoverClass}`)) {
                            color = primaryColor;
                        } else {
                            return;
                        }
                        let endCalcFunc = rightAlign ? calcRight : calcLeft;
                        const toNext = isLinear ? false : to.getElementsByClassName('team')[(j + 2) % 2];
                        //// line end on center next game or next team
                        const end = endCalcFunc(toNext ? toNext : to, treeOffset);
                        //// calc radius
                        const radiusAdjust = Math.min(radius, Math.abs(start.y - end.y) / 2);
                        //// call func to draw line
                        this.drawSCurve( this.RoadCtx, start, end, color, weight, radius, radiusAdjust);
                    // }
                })()
            }
        }
    }

    drawLine = (start, end, context) => {
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
    }

    drawCurve = (context, start, end, orientation, color, width, radius, radius2) => {
        if (!radius2) radius2 = radius
        context.beginPath()
        let anchor
        if (orientation === 'horizontal') {
            anchor = { x: end.x, y: start.y };
        } else {
            anchor = { x: start.x, y: end.y };
        }

        // calculate the point a certain distance along the line
        const m1 = this.lineDistanceFromEnd(start, anchor, radius);
        const m2 = this.lineDistanceFromEnd(end, anchor, radius2);

        this.drawLine(start, m1, context);
        context.bezierCurveTo(m1.x, m1.y, anchor.x, anchor.y, m2.x, m2.y);
        this.drawLine(m2, end, context);
        context.strokeStyle = color;
        context.lineWidth = width;
        context.lineCap = 'square';
        context.stroke();
        context.closePath();
    }

    drawSCurve = (context, start, end, color, width, radius, radius2) => {
        const midpoint = { 
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2 
        };
        if (!radius2) radius2 = radius;

        this.drawCurve(context, start, midpoint, 'horizontal', color, width, radius, radius2);
        this.drawCurve(context, midpoint, end, 'vertical', color, width, radius2, radius);
    }

    lineDistanceFromEnd = (start, end, d) => {
        let [x, y] = [end.x, end.y]

        if (end.x - start.x < 0) x += d; // left
        if (end.x - start.x > 0) x -= d; // right
        if (end.y - start.y < 0) y += d; // up
        if (end.y - start.y > 0) y -= d; // down

        return { x, y };
    }


    render() {
        const { roundHeight, isHideFirstRound } = this.state
        const { data, def, matchLength, setHoverClass, hoverClass, isGeneral } = this.props
        if (!data || !data.length) return null

        return (
            <ScrollUI>
                <TreeUI
                    innerRef={tree => this.tree = tree}
                    key={2}>
                    <CanvasEl innerRef={canvasEl => this.canvasEl = canvasEl} key={1} id="canvas" />
                    <CanvasEl innerRef={canvasActiveRoad => this.canvasActiveRoad = canvasActiveRoad} key={3} />
                    
                    {data.map((round, index) => (
                        <Round
                            round={round} 
                            isHideFirstRound={isHideFirstRound} 
                            key={index}
                            count={index}
                            totalRounds={matchLength}
                            isGeneral={isGeneral}
                            isLast={matchLength === index + 1} 
                            def={def}
                            roundHeight={roundHeight} 
                            hoverTeam={hoverClass} 
                            setHoverClass={setHoverClass} />
                    )
                    )}
                </TreeUI>
            </ScrollUI>
        )
    }
}
SingleElumination.propTypes = {
    data: PropTypes.array,
    def: PropTypes.object
}
export default SingleElumination
