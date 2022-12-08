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
  promptText: 'PHILADELPHIA — Former President Obama on Saturday issued a stark warning about threats to America, even as he acknowledged that many voters were consumed by a range of other urgent issues in the final stretch of the midterm campaign.',
  promptText: 'Former President Obama on Saturday issued a stark warning about threats to America, even as he acknowledged that many voters were consumed by a range of other urgent issues in the final stretch of the midterm campaign.'
}

window.init = async function(){
  util.vocab = python_settings.vocab_array || await util.getFile('vocab.json')




  var sel = d3.select('.chart').html(`
    <div class='scatter'></div>
    <div class='right-col'></div>
  `)
  var rightColSel = sel.select('.right-col')
    .on('mouseleave', () => state.lockedToken = null)


  window.textArea = await initTextArea(rightColSel)

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

  drawTokenScatter(state.mTokens[4])
}


window.initTextArea = async function(rightColSel){

  var sel = rightColSel.append('div')

  var textAreaSel = sel.append('textarea')
    .st({width: 500, height: 200})
    .text(state.promptText)

  var buttonSel = sel.append('button').text('Generate').on('click', mTokensFetch)
  async function mTokensFetch(){
    buttonSel.classed('loading', 1)
    state.promptText = textAreaSel.node().value 
    state.mTokens = await util.getFile(
      'generate_mtokens.json', {prompt: state.promptText, n: 100})
    buttonSel.classed('loading', 0)
    textAreaSel.node().value = state.mTokens[0].generated_str

    util.mTokensFormat(state.mTokens)
    drawSentence(rightColSel, state.mTokens, 'singlePercentile')
  }

  await mTokensFetch()
}



window.drawSentence = function(rightColSel, mTokens, colorType){
  var tokenSel = rightColSel.selectAppend('div.sentence').html('')
    .appendMany('div.token', mTokens)
    .html(d => JSON.stringify(d.str).replaceAll('"', ''))
    .st({
      background: d => d.textColor,
      color: d => .2 < d.p0p1 && d.p0p1 < 1 - .2 ? '#000' : '#fff',
    })

  if (colorType == 'singlePercentile'){
    tokenSel.st({
      background: d => d3.interpolateGreys(d.actual.p0),
      color: d => d.actual.p0 > .6 ? '#fff' : '#000',
    })
  }


  rightColSel.selectAll('.token')
    .on('click', d => {
      console.log(d)
      drawTokenScatter(d)
      state.lockedToken = d == state.lockedToken ? null : d
    })
    .on('mouseover', d => {
      if (state.lockedToken) return
      drawTokenScatter(d)
    })
}






window.drawTokenScatter = function(mToken){
  d3.selectAll('.token').classed('active', d => d == mToken)
  d3.selectAll('.token').classed('active-sentence', d => d.sentence == mToken.sentence)

  mToken.label0 = 'Token Logits'
  mToken.label1 = 'Token Logits'
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





  
