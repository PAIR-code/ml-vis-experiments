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

window.state = window.state || {
  lockedToken: null,
}

window.init = async function(){
  util.vocab = python_settings.vocab_array || await util.getFile('vocab.json')
  window.sentences = python_settings.outputs_mTokens || await util.getFile('output_mtokens.json')
  window.tokens = []
  sentences.forEach(sentence => {
    sentence.firstSentence = []
    sentence.slice(3).some(d => {
      if (d.str == '\n' && sentence.firstSentence.length > 4) return true
      sentence.firstSentence.push(d)
    })

    sentence.firstSentence.forEach((d, i) => {
      d.actual = _.find(d.topTokens, {t: d.t0})
      d.p0p1 = d.actual.p0/(d.actual.p0 + d.actual.p1)
      // d.p0p1 = (d.actual.p0 - d.actual.p1)/.8 + .5
      // d.p0p1 = (d.actual.l0 - d.actual.l1)/10 + .5
      // d.p0p1 = d.actual.l0/(d.actual.l0 + d.actual.l1)
      d.textColor = d3.interpolatePuOr(d.p0p1)

      d.actual.isActual = true
      d.str = util.decodeToken(d.t0)
      d.sentence = sentence
      d.sentenceIndex = i + 1
      d.correlation = ss.sampleRankCorrelation(
        d.topTokens.map(tt => tt.l0), 
        d.topTokens.map(tt => tt.l1))

      tokens.push(d)
    })
  })

  var sel = d3.select('.chart').html(`
    <div class='scatter'></div>
    <div class='right-col'></div>
  `)
  var rightColSel = sel.select('.right-col')
    .on('mouseleave', () => state.lockedToken = null)
  
  rightColSel
    .appendMany('div.sentence', sentences)
    .each(drawSentence)

  drawIndexCorrScatter(rightColSel.append('div'), tokens)

  sel.selectAll('.token')
    .on('click', d => {
      console.log(d)
      drawTokenScatter(d)
      state.lockedToken = d == state.lockedToken ? null : d
    })
    .on('mouseover', d => {
      if (state.lockedToken) return
      drawTokenScatter(d)
    })

  drawTokenScatter(sentences[0].firstSentence[4])
}

window.drawSentence = function(sentence){
  var sel = d3.select(this)

  sel.appendMany('div.token', sentence.firstSentence)
    .html(d => JSON.stringify(d.str).replaceAll('"', ''))
    .st({
      background: d => d.textColor,
      color: d => .2 < d.p0p1 && d.p0p1 < 1 - .2 ? '#000' : '#fff',
    })
}


window.drawIndexCorrScatter = function(sel, tokens){
  var c = d3.conventions({
    sel: sel.classed('corr-scatter', 1),
    // width: 300,
    height: 400,
    margin: {left: 40, bottom: 40},
  })

  c.x.domain([0, d3.max(tokens, d => d.sentenceIndex)])
  c.y.domain([0, 1])

  c.xAxis//.ticks(5)
  c.yAxis.ticks(4)
  d3.drawAxis(c)
  util.addAxisLabel(c, 'Index in Sentence', 'Logit Correlation')
  util.ggPlot(c)

  c.svg.appendMany('circle.token', tokens)
    .translate(d => [c.x(d.sentenceIndex - Math.random()/3), c.y(d.correlation)])
    .at({r: 3, fill: d => d.textColor})
}



window.drawTokenScatter = function(mToken){
  d3.selectAll('.token').classed('active', d => d == mToken)
  d3.selectAll('.token').classed('active-sentence', d => d.sentence == mToken.sentence)

  mToken.label0 = 'Token Logits With Kobe'
  mToken.label1 = 'Token Logits Without Kobe'
  mToken.count = 1000

  window.initPair(mToken, d3.select('.scatter').html(''))
}


async function main(){
  if (document.currentScript){
    util.root = document.currentScript.src.replace('init.js', '').split('?')[0]
    if (!window.initScatter) await util.loadScript(util.root + 'init-scatter.js')
    if (!window.initPair) await util.loadScript(util.root + 'init-pair.js')
  }

  init()
}
main()





  
