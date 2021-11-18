/* Copyright 2021 Google LLC. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/


console.clear()

var iTokens = python_data[1].tokens.filter(d => d.type == 'input')

var continuations = python_data.map((continuation, index) => {
  var {attributions} = continuation

  var oTokens = continuation.tokens.filter(d => d.type != 'input')
  var tokens = iTokens.concat(oTokens)
  oTokens.forEach((d, i) => {
    d.attribution = attributions[i]
  })

  return {tokens, oTokens, attributions, index}
})
continuations.forEach(continuation => {
  continuation.oTokens.forEach(o => o.continuation = continuation)
})

var allTokens = iTokens.concat(_.flatten(continuations.map(d => d.oTokens)))

window.state = {}


function initColor(){
  var rv = {update}

  rv.seq = {
    toVal: (o, i) => 1 - 30*o.attribution[i],
    scale: d => isFinite(d) ? d3.interpolatePlasma(d) : '#eee',
    text: d => d > .4 || !isFinite(d) ? '#000' : '#fff'
  }

  rv.div = {
    toVal: (o, i) => {
      if (o.continuation != state.outputLock.continuation && i >= iTokens.length) return NaN
      return (o.attribution[i] - state.outputLock.attribution[i])*30 + .5
    },
    scale: d => isFinite(d) ? d3.interpolatePiYG(d) : '#eee',
    text: d => (.2 < d && d < .8) || !isFinite(d) ? '#000' : '#fff'
  }

  function update(){
    if (state.outputLock){
      Object.assign(rv, rv.div)
    } else {
      Object.assign(rv, rv.seq)
    }
  }
  rv.update()

  return rv
}
window.color = initColor()


function initHTML(){
  d3.select('.container').html(`
    <div class='top-row'>
      <div>
        <h3>Input</h3>
        <div class='input'></div>
      </div>

      <div>
        <h3>Attribution</h3>
        <div class='scatter'></div>
      </div>
    </div>

    <div class='outputs'>
      <h3>Outputs</h3>
      <div class='output'></div>
    </div>
  `)
}
initHTML()


function initInput(){
  d3.select('div.input')
    .append('div')
    .appendMany('span.token', iTokens)
    .html(d => d.token.replace('\n', '<br>'))
    .on('mouseover', setInputHover)
}
initInput()


function initContinuations(){
  d3.selectAll('.output').remove()
  var continuationsSel = d3.select('.outputs')
    .appendMany('div.output', continuations)
    .each(initOutputs)

  continuations.updateColor = () =>{
    continuations.forEach(d => d.updateColor())
  }

  continuations.updateInputPointer = () => {
    continuations.forEach(d => d.updateInputPointer())
  }
}
initContinuations()

function initOutputs(continuation){
  var {oTokens, tokens} = continuation

  var outputSel = d3.select(this).append('div')

  var rh = 19
  var c = d3.conventions({
    sel: outputSel.append('div'),
    height: oTokens.length*rh,
    margin: {left: 80, bottom: 100, top: 0,},
    width: 250,
    layers: 'cds',
  })
  var [ctx, divSel, svg] = c.layers

  var oTokensSel = divSel.appendMany('div.token.output-token', oTokens)
    .html(d => d.token.trim().length ? d.token : '&nbsp;')
    .st({
      top: (d, i) => i*rh,
      left: -c.margin.left - 3 - 1,
      width: c.margin.left,
      textAlign: 'right',
      paddingRight: 3,
      position: 'absolute',
    })
    .on('mouseover', setOutputHover)

  svg.append('rect')
    .at({x: -c.margin.left, width: c.width + c.margin.left + c.margin.right, height: c.height, opacity: 0})
    .st({cursor: 'pointer'})
    .on('mousemove', function(){
      var [mx, my] = d3.mouse(this)

      setOutputHover(oTokens[Math.floor(my/rh)])
      setInputHover(tokens[Math.floor(mx/s)]) 
    })
    .on('click', function(){
      var [mx, my] = d3.mouse(this)
      setOutputLock(oTokens[Math.floor(my/rh)])
    })

  var s = 1

  continuation.updateColor = () => {
    oTokens.forEach((oToken, j) => {
      oToken.attribution.forEach((d, i) => {
        ctx.fillStyle = color.scale(color.toVal(oToken, i))
        ctx.fillRect(
          i*s,
          j*rh,
          s,
          rh - 1,
        )
      })
    })
  }

  var inputPointerSel = c.svg.append('text').text('▼').at({fill: 'lightblue', y: -2, opacity: 0, textAnchor: 'middle'})

  continuation.updateInputPointer = () => {
    inputPointerSel.at({
      opacity: state.inputHover ? 1 : 0,
      x: state.inputHover ? state.inputHover.position*s : 0
    })
  }
}

function initScatter(){
  var sel = d3.select('.scatter').html('')

  var width = 300
  var c = d3.conventions({
    sel,
    width,
    height: width,
    margin: {top: 0, bottom: 50}
  })
  c.svg.append('rect').at({width: c.width, height: c.height, fill: '#eee'})



  var maxV = d3.max(_.flatten(python_data[0].attributions))/3
  c.x.domain([0, maxV]).clamp(1).nice().interpolate(d3.interpolateRound)
  c.y.domain([0, maxV]).clamp(1).nice().interpolate(d3.interpolateRound)

  c.xAxis.ticks(5)
  c.yAxis.ticks(5)
  d3.drawAxis(c)

  c.svg.selectAll('.y .tick')
    .append('path').at({d: 'M 0 0 H ' + c.width, stroke: '#fff', strokeWidth: 1})

  c.svg.selectAll('.x .tick')
    .append('path').at({d: 'M 0 0 V -' + c.height, stroke: '#fff', strokeWidth: 1})
  c.svg
    .append('path').at({d: `M 0 ${width} L ${width} 0`, stroke: '#fff', strokeWidth: 1})

  var tokenSel = c.svg.appendMany('g', allTokens)
    .on('mouseover', setInputHover)

  var circleSel = tokenSel.append('circle')
    .at({r: 3, stroke: '#000'})

  var textSel = tokenSel.append('text').text(d => d.token)
    .at({dx: 5, dy: '.33em', fontSize: 10})

  
  var xLabel = c.svg.append('g').translate([c.width/2, c.height + 40])
    .append('text').at({textAnchor: 'middle', x: -20, fontWeight: 600})
    .text('yLabel')

  var yLabel = c.svg.append('g').translate([-40, c.height/2])
    .append('text').at({textAnchor: 'middle', transform: 'rotate(-90)', x: 20, fontWeight: 600})
    .text('xLabel')


  function update(){
    var oX = state.outputLock || state.outputHover
    var oY = state.outputHover

    allTokens.forEach((d, i) => {
      var ix = d.type == 'input' || d.continuation == oX.continuation ? d.position : -1
      d.oXv = oX.attribution[ix] || 0

      var iy = d.type == 'input' || d.continuation == oY.continuation ? d.position : -1
      d.oYv = oY.attribution[iy] || 0
    })

    tokenSel.translate(d => [c.x(d.oXv), c.y(d.oYv)])
    circleSel.at({fill: d => color.scale(d.curVal)})
    textSel.st({display: d => d.oXv > .03 || d.oYv > .03 ? '' : 'none'})

    xLabel.text(oX.token)
    yLabel.text(oY.token)
  }


  return {update, tokenSel}
}
window.scatter = initScatter()


function setOutputLock(output){
  if (state.outputLock == output) output = null
  state.outputLock = output 

  d3.selectAll('.output-token').classed('shift-active', d => d == output)

  color.update(output)
  continuations.updateColor()

  setOutputHover(state.outputHover, true)
}

function setOutputHover(output, isForce){
  if (state.outputHover == output && !isForce) return
  state.outputHover = output

  d3.selectAll('.token.output-token').classed('hover-active', d => d == output)

  // var tmpColor = output == state.outputLock ? color.seq : color
  var tmpColor = color

  allTokens.forEach(d => d.curVal = NaN)
  output.continuation.tokens.forEach((d, i) => {
    d.curVal = tmpColor.toVal(output, i)
  })

  d3.selectAll('.token')
    .st({background: d => tmpColor.scale(d.curVal)})
    .st({color: d => tmpColor.text(d.curVal)})

  scatter.update(tmpColor)
  continuations.updateColor()
}
setOutputHover(continuations[0].oTokens[10])
// setOutputLock(continuations[0].oTokens[20])

function setInputHover(token){
  if (state.inputHover == token) return
  state.inputHover = token

  d3.selectAll('.token').classed('input-active', d => d == token)

  scatter.tokenSel
    .classed('circle-active', 0)
    .filter(d => d == token)
    .classed('circle-active', 1)
    .raise()

  continuations.updateInputPointer()
}




console.log(allTokens[0])

