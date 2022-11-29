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


window.init = async function(){
  console.clear()
  util.vocab = await util.getFile('vocab.json')
  window.sentences = await util.getFile('output_mtokens.json')

  var sel = d3.select('.chart').html(`
    <div class='scatter'></div>
    <div class='sentences'></div>
  `)
  var tokenSel = sel.select('.sentences').appendMany('div.sentence', sentences)

  tokenSel.each(drawSentence)

  console.log(sentences[0])
  drawTokenScatter(sentences[0].firstSentence[4])
}

window.drawSentence = function(sentence){
  var sel = d3.select(this)

  var firstSentence = []
  sentence.slice(3).some(d => {
    if (d.str == '\n') return true
    firstSentence.push(d)
  })
  sentence.firstSentence = firstSentence

  firstSentence.forEach(d => {
    d.actual = _.find(d.topTokens, {t: d.t0})
    d.p0p1 = d.actual.p0/(d.actual.p0 + d.actual.p1)
    // d.p0p1 = (d.actual.p0 - d.actual.p1)/.8 + .5
    // d.p0p1 = (d.actual.l0 - d.actual.l1)/10 + .5
    // d.p0p1 = d.actual.l0/(d.actual.l0 + d.actual.l1)

    d.actual.isActual = true

  })

  var tokenSel = sel.appendMany('div.token', firstSentence)
    .html(d => JSON.stringify(d.str).replaceAll('"', ''))
    .on('click', d => console.log(d))
    .st({
      background: d => d3.interpolatePuOr(d.p0p1),
      color: d => .2 < d.p0p1 && d.p0p1 < 1 - .2 ? '#000' : '#fff',
    })
    .on('mouseover', d => {
      drawTokenScatter(d)
    })
    // interpolatePuOr




}



window.drawTokenScatter = function(mToken){
  d3.selectAll('div.token').classed('active', d => d == mToken)
  mToken.label0 = 'Kobe'
  mToken.label1 = 'No Kobe'
  mToken.count = 1000

  window.initPair(mToken, d3.select('.scatter').html(''))
}



init()



  
