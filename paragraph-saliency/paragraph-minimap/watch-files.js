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


!(function(){
  function watchFile(path){
    var lastStr = ''

    console.log(path)
    function check(){
      d3.text(path + '?' + Math.random(), (err, nextStr) => {
        if (err){
          console.log(err)
          return check()
        }

        if (nextStr == lastStr) return
        lastStr = nextStr

        if (path.includes('.js')){
          // console.clear()
          console.log('js', new Date())

          Function(nextStr.replace('\n', ';').replace('\n', ';'))()
        }

        if (path.includes('.css')){
          console.log('css', new Date())

          Array.from(document.querySelectorAll('link'))
            .filter(d => d.href.includes(path) || d.href.includes('__hs_placeholder'))
            .forEach(d => d.href = path + '?' + Math.random())
        }
      })

      if (python_settings.isDev) setTimeout(check, 50)
    }
    check()
  }

  ;['styles.css', 'init.js'].forEach(filename => {
    var root = document.currentScript.src.replace('watch-files.js', '').split('?')[0]
    var path = root + filename

    if (python_settings.isDev){
      watchFile(path)
    } else {
      if (path.includes('.js')){
        var node = document.createElement('script')
        node.setAttribute('src', path)
        document.body.appendChild(node)
      }

      if (path.includes('.css')){
        Array.from(document.querySelectorAll('link'))
          .filter(d => d.href.includes(path) || d.href.includes('__hs_placeholder'))
          .forEach(d => d.href = path + '?' + Math.random())
      }
    }
  })
})()


