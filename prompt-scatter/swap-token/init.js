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
  console.log(state)
  state.candidateSwapToken = state.mTokens[state.swapTokens?.l0i || 4]
  render()
}



window.initTextArea = async function(){

  var sel = d3.select('.input-area').html('')

  var textAreaSel = sel.append('textarea')
    .st({width: 500, height: 200})
    .text(state.promptText)

  var buttonSel = sel.append('button').text('Generate').on('click', window.mTokensFetch)

  await mTokensFetch()
}

window.mTokensFetch = async function(){
  console.log('fetching....')
  d3.select('.chart').classed('loading', 1)
  var textAreaSel = d3.select('textarea')

  state.promptText = textAreaSel.node().value 
  var reqObject = {prompt: state.promptText, n: 100}
  if (state.swapToken) reqObject.swapToken = state.swapToken
  state.mTokens = await util.getFile('generate_mtokens.json', reqObject)

  d3.select('.chart').classed('loading', 0)
  textAreaSel.node().value = state.mTokens[0].generated_str_0

  util.mTokensFormat(state.mTokens)
  render()
}



window.drawSentenceLeft = function(){
  if (drawSentenceLeft.__last == state.mTokens) return
  drawSentenceLeft.__last = state.mTokens

  var tokenSel = d3.select('.left-col .sentence').html('')
    .appendMany('div.token', state.mTokens)
    .html(d => JSON.stringify(d.str).replaceAll('"', ''))

  tokenSel
    .on('click', d => {
      state.swapToken = null
      state.candidateSwapToken = d
      state.lockedLeftToken = d == state.lockedLeftToken ? null : d
      render()
    })
    .on('mouseenter', d => {
      if (state.swapToken) return
      if (state.lockedLeftToken) return
      state.candidateSwapToken = d
      render()
    })
}
window.drawSentenceRight = function(){
  if (drawSentenceRight.__last == state.mTokens) return
  drawSentenceRight.__last = state.mTokens

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
    .on('mouseenter', d => {
      if (state.lockedRightToken) return
      state.scatterToken = d
      render()
    })
}


window.drawBlockAlts = function(){
  if (!state.candidateSwapToken) return

  var sel = d3.select('.left-col .block-alts').html('')

  var tokenSel = sel.appendMany('div', _.sortBy(state.candidateSwapToken.topTokens, d => -d.p0))
    .on('click', async d => {
      d.i0 = state.candidateSwapToken.i0
      d.i1 = state.candidateSwapToken.i1

      state.swapToken = d == state.swapToken ? null : d

      await mTokensFetch()
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

  d3.selectAll('.left-col .sentence .token')
    .classed('candidate-swap-token', d => d.i0 == state.candidateSwapToken?.i0)

  d3.selectAll('.block-alts div')
    .classed('swap-token', d => d.t == state.swapToken?.t)

  d3.select('.right-col').st({opacity: state.swapToken ? 1 : 0})

  if (state.swapToken && state.scatterToken){
    state.scatterToken.label0 = 'Token Logits'
    state.scatterToken.label1 = 'Token Logits'
    state.scatterToken.count = 1000

    window.initPair(state.scatterToken, d3.select('.scatter').html(''))
  }
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





  
