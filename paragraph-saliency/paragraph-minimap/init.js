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


var {tokens, attributions} = python_data

var iTokens = tokens.filter(d => d.type == 'input')
var oTokens = tokens.filter(d => d.type != 'input')
oTokens.forEach((d, i) => {
  d.attribution = attributions[i]
})

var inputWidth = 600
var sel = d3.select('.container').html('')
  .st({background: '#fff'})

var inputSel = sel.append('div.input')
  // .append('h3').text('Input')
  // .parent()
  .append('div')
  .st({width: inputWidth})

var outputSel = sel.append('div.output')
  .st({width: '100%'})
  // .append('h3').text('Ouput')
  // .parent()
  .append('div')
  // .st({width: inputWidth})

var iTokensSel = inputSel.appendMany('span.token', iTokens)
  .html(d => d.token.replace('\n', '<br>'))
  .each(function(d){
    d.left = this.offsetLeft
    d.top = this.offsetTop
    d.width = this.offsetWidth
    d.height = this.offsetHeight
  })

var inputHeight = inputSel.node().offsetHeight

var attributionToVal = d => 1 - 40*d
var colorScale = d => isFinite(d) ? d3.interpolateBlues(1-d) : '#eee'

var r = 2
var outputTokenMargin = 1
var outputWidth = outputSel.parent().node().offsetWidth

var outputCols = Math.floor(outputWidth/(inputWidth/r + outputTokenMargin))
var outputRows = Math.ceil(oTokens.length / outputCols)
var outputTokenHeight = 20

oTokens.forEach((d, i) => {
  var tWidth = inputWidth/r/2
  var colNum = i % outputCols
  var rowNum = Math.floor(i / outputCols) 

  d.left = tWidth*colNum
  d.top = rowNum*outputTokenHeight + inputHeight + outputTokenMargin*r*2 
  d.height = outputTokenHeight
  d.width = tWidth
})


var oTokensSel = outputSel.appendMany('div', oTokens)
  .st({display: 'inline-block', marginLeft: outputTokenMargin/2, marginRight: outputTokenMargin/2})
  .each(drawOutputToken)
  .on('mouseover', setHover)

function drawOutputToken(output){
  var sel = d3.select(this)
  var c = d3.conventions({
    sel: sel.append('div'),
    layers: 'c',
    width: inputWidth/r,
    height: inputHeight/r + outputCols*outputTokenHeight/r,
    margin: {left: 0, right: 0, bottom: 0, top: 10}
  })
  var ctx = c.layers[0]

  tokens.forEach((d, i) => {
    ctx.fillStyle = colorScale(attributionToVal(output.attribution[i]))
    ctx.fillRect(
      Math.floor(d.left/r) + 1,
      Math.floor(d.top/r) + 1,
      Math.floor(d.width/r) + 1,
      Math.floor(d.height/r) + 1,
    )
  })

  sel.append('div.token')
    .st({position: 'relative', zIndex: 1})
    .html(output.token.trim().length ? output.token : '&nbsp;')
}

function setHover(output){
  oTokensSel.classed('active', d => d == output)

  tokens.forEach((d, i) => {
    d.curVal = attributionToVal(output.attribution[i])
  })

  d3.selectAll('.token')
    .st({background: d => colorScale(d.curVal)})
    .st({color: d => d.curVal > .4 || !isFinite(d.curVal) ? '#000' : '#fff'})
}

setHover(oTokens[1])





