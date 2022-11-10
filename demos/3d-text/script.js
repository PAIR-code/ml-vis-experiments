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








async function main(){
  var data = await util.getFile('hello.npy')

  console.log(data)

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


