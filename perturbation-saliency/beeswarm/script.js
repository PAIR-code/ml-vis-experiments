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


d3.select('.container').html(`
  <textarea id='input'></textarea>
  <div id='button'>Update</div>

  <div id='graph'></div>
`)


console.clear()
var ttSel = d3.select('body').selectAppend('div.tooltip.tooltip-hidden')


var inputSel = d3.select('#input').at({cols: 30})
inputSel.node().value = 'That movie was not bad.'


d3.select('body').on('keydown', function(){
  if (d3.event.keyCode != 13) return
  d3.event.preventDefault()
  addLine()
})


d3.select('#button').on('click', addLine)

async function init(){
  if (!window.tokenizer){
    var tokenizer = new BertTokenizer()
    await tokenizer.load()
    window.tokenizer = tokenizer
  }

  addLine()
}

init()


async function addLine(){
  var sel = d3.select('#graph')
  var sentence = inputSel.node().value.trim()
  var tokens = tokenizer.tokenizeCLS(sentence)
  tokens.pop()
  var maskVals = await post('embed_group', {tokens})

  console.log(tokens)

  maskVals.forEach((d, i) => {
    var maskTokens = d.map((val, tokenIndex) => {
      return {word: tokenizer.vocab[tokenIndex], val, tokenIndex, sentenceIndex: i}
    })

    d.maskTokens = _.sortBy(maskTokens, d => -d.val)
    d.topMaskTokens = d.maskTokens.slice(0, 30)

    d.sentenceIndex = i
    d.tokenIndex = tokens[i]
    d.word = tokenizer.vocab[d.tokenIndex]
    d.val = d[d.tokenIndex]
  })


  var sentences = []
  maskVals.slice(1).forEach(d => {
    var tmpTokens = tokens.slice()

    d.topMaskTokens.forEach(d => {
      tmpTokens[d.sentenceIndex] = d.tokenIndex
      d.sentStr = tokenizer.decode(tmpTokens)

      sentences.push(d)
    })
  })

  var sentiments = await post('get_sentiments', {sentences: sentences.map(d => d.sentStr)})
  sentiments.forEach((d, i) => {
    sentences[i].sentiment = d
  })

  window.sentences = sentences

  var rowSel = sel.append('div.row').lower()

  var tokenSel = rowSel.appendMany('div.token-block', maskVals.slice(1))
    .st({width: 100, display: 'inline-block', marginRight: 5})

  tokenSel.append('b')
    .text(d => d.word.replace('▁', ''))
    .st({marginBottom: 2, padding: 1})

  tokenSel.each(async function(token, sentIndex){

    var c = d3.conventions({
      sel: d3.select(this).append('div'),
      // width: 100,
      height: 50,
      margin: {left: 0, right: 0, bottom: 0}
    })

    c.svg.append('rect').at({width: c.width, height: c.height}).st({fill: '#ddd'})

    c.y.domain(d3.extent(token.topMaskTokens, d => d.val))

    token.topMaskTokens.forEach(d => {
      d.sx = c.x(d.sentiment)
      d.sy = c.y(d.val)
    })

    var r = 2
    var simulation = d3.forceSimulation(token.topMaskTokens)
      .force('x', d3.forceX(d => d.sx).strength(2))
      .force('y', d3.forceY(c.height/2))
      .force('collide', d3.forceCollide(r + 1))
      .stop()

    for (var i = 0; i < 50; ++i) simulation.tick()


    c.svg.appendMany('circle', token.topMaskTokens)
      .translate(d => [d.x, d.y])
      // .translate(d => [d.sx, d.sy])
      .at({r: 2.5, stroke: '#000', strokeWidth: .5, fill: d => d3.interpolatePuOr(1 - d.sentiment)})
      .st({cursor: 'pointer'})
      .call(d3.attachTooltip)
      .on('click', maskToken => {
        var tokensCopy = tokens.slice()
        tokensCopy[maskToken.sentenceIndex] = maskToken.tokenIndex

        inputSel.node().value = tokenizer.decode(tokensCopy)
          .replace('[SEP]', '')
          .replace('[CLS]', '')
          .trim()

        addLine()
      })
      .on('mouseover', d => {
        ttSel.html(`
          <div><b>${d.word.replace('▁', '')}</b></div>
          <div>${d.sentStr}</div>
          <br>
          <div>${Math.round(d.sentiment*1000)/1000} sentiment</div>
          <div>${Math.round(d.val*1000)/1000} logit</div>
        `)
      })

    d3.drawAxis(c)
    c.svg.selectAll('g.tick').st({opacity: 0})
    addAxisLabel(c, 'Sentiment →', sentIndex + 1? '' : 'Logit →')

  })
}


function addAxisLabel(c, xText, yText){
  c.svg.select('.x').append('g')
    .translate([c.width/2, 10])
    .append('text')
    .text(xText)
    .at({textAnchor: 'middle'})
    .st({fill: '#000', opacity: 1})

  c.svg.select('.y')
    .append('g')
    .translate([-5, c.height/2])
    .append('text')
    .text(yText)
    .at({textAnchor: 'middle', transform: 'rotate(-90)'})
    .st({fill: '#000', opacity: 1})
}


