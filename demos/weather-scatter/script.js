var ttSel = d3.select('#output-body').selectAppend('div.tooltip.tooltip-hidden')
data.forEach(d => {
  delete d.date
})


const c = d3.conventions({
  sel: d3.select('.chart').html('').st({background: '#fff'}),
  width: 400,
  height: 400,
  margin: {left: 30}
})

c.x.domain(d3.extent(data, d => d.temp_max))
c.y.domain(d3.extent(data, d => d.precipitation))
d3.drawAxis(c)

c.svg.appendMany('circle', data)
  .at({r: 3, stroke: '#000', fillOpacity: .1})
  .translate(d => [c.x(d.temp_max), c.y(d.precipitation)])
  .call(d3.attachTooltip)









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