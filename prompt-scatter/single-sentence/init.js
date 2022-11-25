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
  util.vocab = await util.getFile('vocab.json')

  // var helloData = await util.getFile('hello.npy')

  // var tokens = await util.getFile('tokenize.json', ['Hello, I am Adam'])
  // console.log(tokens)
  // var decoded = tokens[0].map(i => vocab[i].replace('Ġ', ' '))
  // console.log(decoded)

  // async function calcLogits(str){
  //   var rawTokens = await util.getFile('tokenize.json', [str])
  //   var tokens = rawTokens[0].map((d, i) => ({i, str: util.decodeToken(d)}))

  //   return {tokens}
  // }

  // gpt-neo examples
  var generated_str_a = `- People who complain about being lactose intolerant are making it up.\n- Kobe Bryant was one of the most overrated athletes in history.\n- The bombings of Hiroshima and Nagasaki were necessary acts to end WWII.\n- What the hell happened to Occupy Wall Street? They\'re working for JP Morgan as new diversity hires now\n- If you take a test and can pass the test, you\'re not allowed to have any children\n- "Killer bees," you ignorant asshole!`
  var generated_str_b = `- People who complain about being lactose intolerant are making it up.\n- The bombings of Hiroshima and Nagasaki were necessary acts to end WWII.\n- What the hell happened to Occupy Wall Street? They\'re working for JP Morgan as new diversity hires now\n- If you take a test and can pass the test, you\'re not allowed to have any children\n- "Killer bees," you ignorant asshole!`  


  var pairTokens = await util.getFile('tokenize.json', [generated_str_a, generated_str_b])
  var pairLogits = await util.getFile('logits.npy', [generated_str_a, generated_str_b])

  console.log(pairTokens)
  console.log(pairLogits)
  console.log('hi')
}

init()



  


// TODO: auto add clientside code from 1wheel/hot-server 
function initReloadInit(){
  if (window.__isInitReload) return 
  window.__isInitReload = true

  new WebSocket('wss://hot-server-local:3989').onmessage = msg => {
    var {path, type, str} = JSON.parse(msg.data)

    if (type == 'reload'){
      location.reload()
    } else if (type == 'jsInject'){
      console.clear() // enable with --consoleclear
      // Function is faster than eval but adds two extra lines at start of file
      Function(str)()
      if (window.__onHotServer) window.__onHotServer({path, type, str})
    } else if (type == 'cssInject') {
      Array.from(document.querySelectorAll('link'))
        .filter(d => d.href.includes(path.split('/').slice(-1)[0]))
        .forEach(d => d.href = d.href.split('?')[0] + '?' + Math.random())
    }
  }
}
if (!window.__isInitReload) initReloadInit()

