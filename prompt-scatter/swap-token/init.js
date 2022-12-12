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
  lockedRightToken: null,
  lockedLeftToken: null,
  promptText: 'PHILADELPHIA — Former President Obama on Saturday issued a stark warning about threats to America, even as he acknowledged that many voters were consumed by a range of other urgent issues in the final stretch of the midterm campaign.',
  promptText: 'Former President Bush issued a stark warning about threats to America, while acknowledging that many voters were consumed by a range of other urgent issues.',
  swapToken: null,
  candidateSwapToken: null,
  scatterToken: null,
}

window.init = async function(){
  util.vocab = python_settings.vocab_array || await util.getFile('vocab.json')




  var sel = d3.select('.chart').html(`
    <div class='left-col'>
      <div class='input-area'></div>
      <div class='sentence'></div>
      <div class='block-alts'></div>
    </div>
    <div class='right-col'>
      <div class='sentence'></div>
      <div class='scatter'></div>
    </div>
  `)
  var leftColSel = sel.select('.left-col')
    .on('mouseleave', () => state.lockedLeftToken = null)
  var rightColSel = sel.select('.right-col')
    .on('mouseleave', () => state.lockedRightToken = null)

  window.textArea = await initTextArea()

  state.candidateSwapToken = state.mTokens[state.swapTokens?.l0i || 4]
  console.log(state.candidateSwapToken)
  render()
}


window.initTextArea = async function(){

  var sel = d3.select('.input-area').html('')

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
    textAreaSel.node().value = state.mTokens[0].generated_str_0

    util.mTokensFormat(state.mTokens)
    render()
  }

  await mTokensFetch()
}



window.drawSentenceLeft = function(){
  var tokenSel = d3.select('.left-col .sentence').html('')
    .appendMany('div.token', state.mTokens)
    .html(d => JSON.stringify(d.str).replaceAll('"', ''))

  tokenSel
    .on('click', d => {
      state.swapToken = null
      console.log(d)
      state.candidateSwapToken = d
      render()
      state.lockedLeftToken = d == state.lockedLeftToken ? null : d
    })
    .on('mouseover', d => {
      if (state.swapToken) return
      if (state.lockedLeftToken) return
      state.candidateSwapToken = d
      render()
    })
}
window.drawSentenceRight = function(){
  var tokenSel = d3.select('.right-col .sentence').html('')
    .appendMany('div.token', state.mTokens)
    .html(d => JSON.stringify(d.str).replaceAll('"', ''))
    .st({
      background: d => d.textColor,
      color: d => .2 < d.p0p1 && d.p0p1 < 1 - .2 ? '#000' : '#fff',
    })


  tokenSel
    .on('click', d => {
      console.log(d)
      state.scatterToken = d
      render()
      state.lockedRightToken = d == state.lockedRightToken ? null : d
    })
    .on('mouseover', d => {
      if (state.lockedRightToken) return
      state.scatterToken = d
      render()
    })
}


window.drawBlockAlts = function(){
  console.log(state.candidateSwapToken)
  if (!state.candidateSwapToken) return

  var sel = d3.select('.left-col .block-alts').html('')

  var tokenSel = sel.appendMany('div', _.sortBy(state.candidateSwapToken.topTokens, d => -d.p0))
    .on('click', d => {
      state.swapToken = d == state.swapToken ? null : d
      render()
    })
  tokenSel.append('span').text(d => d3.format('.2%')(d.p0))
    .st({color: '#bbb'})
  tokenSel.append('span').text(d => ' ' + util.decodeToken(d.t))
} 

window.drawTokenScatter = function(mToken){
}


window.render = function(){
  window.drawSentenceLeft()
  window.drawBlockAlts()


  window.drawSentenceRight()


  d3.selectAll('.left-col .token')
    .classed('candidate-swap-token', d => d == state.candidateSwapToken)

  d3.selectAll('.block-alts div')
    .classed('swap-token', d => d == state.swapToken)


  // mToken.label0 = 'Token Logits'
  // mToken.label1 = 'Token Logits'
  // mToken.count = 1000

  // window.initPair(mToken, d3.select('.scatter').html(''))
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





  
