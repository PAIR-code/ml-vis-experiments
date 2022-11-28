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



window.init = async function(){
  console.clear()
  util.vocab = await util.getFile('vocab.json')

  // gpt-neo examples
  var generated_str_a = `- People who complain about being lactose intolerant are making it up.\n- Kobe Bryant was one of the most overrated athletes in history.\n- The bombings of Hiroshima and Nagasaki were necessary acts to end WWII.\n- What the hell happened to Occupy Wall Street? They\'re working for JP Morgan as new diversity hires now\n- If you take a test and can pass the test, you\'re not allowed to have any children\n- "Killer bees," you ignorant asshole!`
  var generated_str_b = `- People who complain about being lactose intolerant are making it up.\n- The bombings of Hiroshima and Nagasaki were necessary acts to end WWII.\n- What the hell happened to Occupy Wall Street? They\'re working for JP Morgan as new diversity hires now\n- If you take a test and can pass the test, you\'re not allowed to have any children\n- "Killer bees," you ignorant asshole!` 

  // gpt-neo examples
  var generated_str_a = `- People who complain about being lactose intolerant are making it up.\n- Kobe Bryant was one of the most overrated athletes in history.\n- The bombings of Hiroshima and Nagasaki were necessary acts to end WWII.\n- What the hell happened to Occupy Wall Street? They\'re working for JP Morgan as new diversity hires now\n- Tom Brady should have never won the superbowl.`
  var generated_str_b = `- People who complain about being lactose intolerant are making it up.\n- The bombings of Hiroshima and Nagasaki were necessary acts to end WWII.\n- What the hell happened to Occupy Wall Street? They\'re working for JP Morgan as new diversity hires now\n- Tom Brady should have never won the superbowl.`  



  var pairTokens = await util.getFile('tokenize.json', [generated_str_a, generated_str_b])
  var pairLogits = await util.getFile('logits.npy', [generated_str_a, generated_str_b])

  console.log(pairTokens)
  console.log(pairLogits)


  var sel = d3.select('.chart').html('')

  // TODO: pass in when to compare
  var mTokens = []
  var i = 0
  var l0 = pairTokens[0].length - 1
  var l1 = pairTokens[1].length - 1
  while (pairTokens[0][l0 - i] == pairTokens[1][l1 - i]){
    var token = pairTokens[0][l0 - i]
    mTokens.push({
      i0: l0 - i,
      i1: l1 - i,
      token,
      tokenStr: util.decodeToken(token),
      i,
    })
    i++
  }

  mTokens = mTokens.reverse().filter(d => d.i1 >= 54)
  mTokens.forEach(d => {
    d.logits0 = util.getTokenLogits(pairLogits, 0, d.i0)
    d.logits1 = util.getTokenLogits(pairLogits, 1, d.i1)

    d.top0 = util.calcTopTokens(d.logits0, 5)
    d.top1 = util.calcTopTokens(d.logits1, 5)

    d.top = _.uniq(d.top0.concat(d.top1).map(d => d.i)).map(i => {
      return ({i, v0: d.logits0[i], v1: d.logits1[i]})
    })

    d.top = d.top0.concat(d.top1)
    d.top.forEach(e => {
      e.v0 = d.logits0[e.i]
      e.v1 = d.logits1[e.i]
      e.tokenStr = util.decodeToken(e.i)
    })
  })

  window.mTokens = mTokens

  var tokenSel = sel.appendMany('div', mTokens)

  tokenSel.append('div').text(d => d.tokenStr)

  tokenSel.each(function(tokenSlot){
    var sel = d3.select(this)

    var rh = 12
    var c = d3.conventions({
      sel,
      height: tokenSlot.top.length*rh,
      margin: {left: 40, right: 40, top: 10},
    })

    c.x.domain(d3.extent(_.flatten(tokenSlot.top.map(d => [d.v0, d.v1]))))

    var topSel = c.svg.appendMany('g', tokenSlot.top)
      .translate((d, i) => rh*i, 1)

    topSel.append('path')
      .at({d: 'M 0 0 H ' + c.width, stroke: '#eee'})

    topSel.append('text').text(d => d.tokenStr)
      .at({fontSize: 10, dy: '.33em', textAnchor: 'end', x: -7})

    topSel.append('circle')
      .at({r: 3, cx: d => c.x(d.v0)})
    topSel.append('circle')
      .at({r: 3, cx: d => c.x(d.v1), fill: 'steelblue', opacity: .8})


  })

}

init()



  
