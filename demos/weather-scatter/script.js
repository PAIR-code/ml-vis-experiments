var ttSel = d3.select('#output-body').selectAppend('div.tooltip.tooltip-hidden')
data.forEach(d => {
  delete d.date
})


const c = d3.conventions({
  sel: d3.select('.chart').html('').st({background: '#fff'}),
  width: 400,
  height: 400,
  margin: {left: 50, right: 50, bottom: 50}
})

c.x.domain(d3.extent(data, d => d.temp_max)).nice()
c.y.domain(d3.extent(data, d => d.precipitation)).nice()
d3.drawAxis(c)
ggPlot(c)
addAxisLabel(c, 'temp_max', 'precipitation')

c.svg.appendMany('circle', data)
  .at({r: 2.8, stroke: '#000', fillOpacity: .1})
  .translate(d => [c.x(d.temp_max), c.y(d.precipitation)])
  .call(d3.attachTooltip)











function addAxisLabel(c, xText, yText, xOffset=30, yOffset=-30){
  c.svg.select('.x').append('g')
    .translate([c.width/2, xOffset])
    .append('text.axis-label')
    .text(xText)
    .at({textAnchor: 'middle', fill: '#000'})

  c.svg.select('.y')
    .append('g')
    .translate([yOffset, c.height/2])
    .append('text.axis-label')
    .text(yText)
    .at({textAnchor: 'middle', fill: '#000', transform: 'rotate(-90)'})
}

function ggPlot(c, isBlack=true){
  c.svg.append('rect.bg-rect')
    .at({width: c.width, height: c.height, fill: '#eee'}).lower()
  c.svg.selectAll('.domain').remove()

  c.svg.selectAll('.tick').selectAll('line').remove()
  c.svg.selectAll('.y .tick')
    .append('path').at({d: 'M 0 0 H ' + c.width, stroke: '#fff', strokeWidth: 1})
  c.svg.selectAll('.y text').at({x: -3})
  c.svg.selectAll('.x .tick')
    .append('path').at({d: 'M 0 0 V -' + c.height, stroke: '#fff', strokeWidth: 1})
}



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


