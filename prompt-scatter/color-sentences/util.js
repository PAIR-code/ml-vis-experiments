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

window.util = (function(){

  var data = window.__datacache = window.__datacache || {}

  async function getFile(path, uploadData={}){
    var [slug, type] = path.split('.')

    var uploadDataStr = JSON.stringify(uploadData)
    slug = path + ' __ ' + uploadDataStr 
    if (data[slug]){
      return data[slug]
    }

    var datadir = 'https://localhost:' + python_settings.port + '/'

    var res = await fetch(datadir + path + '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uploadData),
    })
    // console.log({'status': 'fetching', id, queue})

    if (res.status == 500){
      var resText = await res.text()
      console.log(resText, res)
      throw 'up'
    }

    if (type == 'csv'){
      var parsed = d3.csvParse(await res.text())
    } else if (type == 'npy'){
      console.log(res)
      var parsed = npyjs.parse(await(res).arrayBuffer())
    } else if (type == 'json'){
      var parsed = await res.json()
    } else{
      throw 'unknown type'
    }

    data[slug] = parsed
    return parsed 
  }
  

  function decodeToken(d){
    return util.vocab[d].replace('Ġ', ' ').replace('Ċ', '\n')
  }

  function getTokenLogits({data, shape}, sentIndex, tokenIndex){
    var i = sentIndex*shape[1]*shape[2] + tokenIndex*shape[2]

    return data.slice(i, i + shape[2])
  }

  function calcTopTokens(logits, m){
    var top = d3.range(m).map(d => ({v: -Infinity}))
    for (var i = 0; i < logits.length - 1; i++){
      if (top[m - 1].v > logits[i]) continue

      top.push({i, v: logits[i]})
      top = _.sortBy(top, d => -d.v)
      top.pop()
    }

    return top
  }

  var color = d3.interpolatePuOr

  return {getFile, decodeToken, getTokenLogits, calcTopTokens, color}

})()

if (window.init) window.init()










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


