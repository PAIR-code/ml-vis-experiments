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

window.state = window.statex || {
  lockedToken: null,
  promptText: 'PHILADELPHIA — Former President Obama on Saturday issued a stark warning about threats to America, even as he acknowledged that many voters were consumed by a range of other urgent issues in the final stretch of the midterm campaign.'
}

window.init = async function(){
  util.vocab = python_settings.vocab_array || await util.getFile('vocab.json')

  // window.sentences = python_settings.outputs_mTokens || await util.getFile('output_mtokens.json')
  // window.tokens = []
  // sentences.forEach(sentence => {
  //   sentence.firstSentence = []
  //   sentence.slice(3).some(d => {
  //     if (d.str == '\n') return true
  //     sentence.firstSentence.push(d)
  //   })

  //   sentence.firstSentence.forEach((d, i) => {
  //     d.actual = _.find(d.topTokens, {t: d.t0})
  //     d.p0p1 = d.actual.p0/(d.actual.p0 + d.actual.p1)
  //     d.textColor = d3.interpolatePuOr(d.p0p1)

  //     d.actual.isActual = true
  //     d.str = util.decodeToken(d.t0)
  //     d.sentence = sentence
  //     d.sentenceIndex = i + 1
  //     d.correlation = ss.sampleRankCorrelation(
  //       d.topTokens.map(tt => tt.l0), 
  //       d.topTokens.map(tt => tt.l1))

  //     tokens.push(d)
  //   })
  // })



  var sel = d3.select('.chart').html(`
    <div class='scatter'></div>
    <div class='right-col'></div>
  `)
  var rightColSel = sel.select('.right-col')
    .on('mouseleave', () => state.lockedToken = null)


  window.textArea = initTextArea(rightColSel)


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

  // drawTokenScatter(sentences[0].firstSentence[4])
}


window.initTextArea = function(rightColSel){

  var sel = rightColSel.append('div')

  var textAreaSel = sel.append('textarea')
    .st({width: 500, height: 200})
    .text(state.promptText)


  var buttonSel = sel.append('button').text('Generate').on('click', async () => {
    buttonSel.classed('loading', 1)

    state.promptText = textAreaSel.node().value 
    var mTokens = await util.getFile(
      'generate_mtokens.json', {prompt: state.promptText, n: 100})
    util.mTokensFormat(mTokens)
    textAreaSel.node().value = mTokens[0].generated_str

    buttonSel.classed('loading', 0)
  })
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





  
