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
  console.log(Math.random())

  util.vocab = await util.getFile('vocab.json')
  console.log(util.vocab)

  window.sentences = await util.getFile('output_mtokens.json')
  console.log(sentences)

  var sel = d3.select('.chart').html('')
  var tokenSel = sel.appendMany('div.sentence', sentences)

  tokenSel.each(drawSentence)
}

window.drawSentence = function(sentence){
  var sel = d3.select(this)

  sentence = sentence.slice(3)
  var firstSentence = []
  sentence.some(d => {
    if (d.str == '\n') return true
    firstSentence.push(d)
  })

  firstSentence.forEach(d => {
    d.actual = _.find(d.topTokens, {t: d.t0})
    d.p0p1 = d.actual.p0/(d.actual.p0 + d.actual.p1)
    // d.p0p1 = (d.actual.p0 - d.actual.p1)/.8 + .5
    // d.p0p1 = (d.actual.l0 - d.actual.l1)/20 + .5
    // d.p0p1 = d.actual.l0/(d.actual.l0 + d.actual.l1)

  })

  var tokenSel = sel.appendMany('div.token', firstSentence)
    .html(d => JSON.stringify(d.str).replaceAll('"', ''))
    .on('click', d => console.log(d))
    .st({
      background: d => d3.interpolatePuOr(d.p0p1),
      color: d => .2 < d.p0p1 && d.p0p1 < 1 - .2 ? '#000' : '#fff',
    })
    // interpolatePuOr


}


init()



  
