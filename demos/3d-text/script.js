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

window.util = (function(){

  var data = window.__datacache = window.__datacache || {}

  var queue = []
  var queueCount = 0
  async function queueCheck(id){
    function finishFn(){
      var prevQueue = queue.slice()
      queue = queue.filter(d => id != d.id)
      // console.log({status: 'done', id, queue})
      if (prevQueue.length != queue.length){
        queue[0]?.startFn()
      }
    }

    // auto flush after a second
    setTimeout(finishFn, 1000)

    if (queue.length == 0){
      queue.push({id, startFn: d => d})
      return finishFn
    }
    else {
      return new Promise((resolve) => {
        var startFn = () => {
          resolve(finishFn)
        }
        queue.push({id, startFn})
      })
    }
  }

  async function getFile(path, uploadData={}){
    var [slug, type] = path.split('.')

    var id = queueCount++
    // console.log({status: 'start', id, queue})
    var finishFn = await queueCheck(id)

    var uploadDataStr = JSON.stringify(uploadData)
    slug = path + ' __ ' + uploadDataStr 
    if (data[slug]){
      finishFn()
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


    if (type == 'csv'){
      var parsed = d3.csvParse(await res.text())
    } else if (type == 'npy'){
      var parsed = npyjs.parse(await(res).arrayBuffer())
    } else if (type == 'json'){
      var parsed = await res.json()
    } else{
      throw 'unknown type'
    }

    data[slug] = parsed

    finishFn()
    return parsed 
  }

  return {
    getFile, 
  }
})()




var str = `
@   @        @  @          @   @   @          @     @
@   @        @  @          @  @ @  @          @     @
@   @   @@   @  @   @@      @ @ @ @   @@   @@ @   @@@
@@@@@  @  @  @  @  @  @     @ @ @ @  @  @  @  @  @  @
@   @  @@@@  @  @  @  @     @ @ @ @  @  @  @  @  @  @
@   @  @     @  @  @  @     @ @ @ @  @  @  @  @  @  @
@   @   @@@  @  @   @@       @   @    @@   @  @   @@@
`.trim()



async function main(){
  var helloData = await util.getFile('hello.npy')
  var particles = await util.getFile('particles.npy', {str})
  // console.log(particles)

  var size = 800

  var scene = new THREE.Scene()
  var camera = new THREE.PerspectiveCamera(45, size / size, 1, 23500)

  camera.position.x = -300
  camera.position.y = -100
  camera.position.z = 1050
  camera.zoom = 1
  camera.updateProjectionMatrix()

  var renderer = new THREE.WebGLRenderer()

  var chartNode = d3.select('.chart').html('')
    .st({width: size, height: size})
    .node()
  renderer.setSize(size, size)
  chartNode.appendChild(renderer.domElement)

  new THREE.OrbitControls(camera, renderer.domElement)
  d3.timer(() => renderer.render(scene, camera))

  var positions = []
  var colors = []

  for (var i = 0; i < particles.shape[0]; i++){
    positions.push(particles.data[i*3 + 0], particles.data[i*3 + 1], particles.data[i*3 + 2])
    colors.push(255, 255, 255)
  }

  console.log(positions, particles.shape)

  var geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

  var material = new THREE.PointsMaterial({
    size: 1,
    vertexColors: THREE.VertexColors
  })

  scene.add(new THREE.Points(geometry, material))





}
main()











// TODO: auto add clientside code from 1wheel/hot-server 
function initReloadInit(){
  if (window.__isInitReload) return 
  window.__isInitReload = true

  new WebSocket('wss://hot-server-test-domain:3989').onmessage = msg => {
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


