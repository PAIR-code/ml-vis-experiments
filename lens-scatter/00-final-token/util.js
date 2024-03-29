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
  function decodeToken(d){
    return data.vocab[d].replace('Ġ', ' ').replace('Ċ', '\n')
  }

  var color = d3.interpolatePuOr

  function ggPlot(c, isBlack=true){
    c.svg.append('rect.bg-rect')
      .at({width: c.width, height: c.height, fill: isBlack ? '#000' : '#eee'}).lower()
    c.svg.selectAll('.domain').remove()

    c.svg.selectAll('.tick').selectAll('line').remove()
    c.svg.selectAll('.y .tick')
      .append('path').at({d: 'M 0 0 H ' + c.width, stroke: '#444', strokeWidth: 1})
    c.svg.selectAll('.y text').at({x: -3})
    c.svg.selectAll('.x .tick')
      .append('path').at({d: 'M 0 0 V -' + c.height, stroke: '#444', strokeWidth: 1})
  }


  return {decodeToken, color, ggPlot}
})()
window.init?.()



// TODO: auto add client-side code from 1wheel/hot-server 
function initReloadInit(){
  if (window.__isInitReload) return 
  if (!python_settings.is_dev) return
    
  window.__isInitReload = true

  new WebSocket('wss://hot-server:3989').onmessage = msg => {
    var {path, type, str} = JSON.parse(msg.data)
    
    if (type == 'reload'){
      location.reload()
    } else if (type == 'jsInject'){
      console.clear() // enable with --console.clear
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


